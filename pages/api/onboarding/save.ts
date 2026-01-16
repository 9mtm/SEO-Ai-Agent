import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../../../database/database';
import User from '../../../database/models/user';
import verifyUser from '../../../utils/verifyUser';
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import refreshAndUpdateKeywords from '../../../utils/refresh';
import { getAppSettings } from '../settings';
import { generateBusinessAnalysisPrompt, generateFocusKeywordsPrompt, generateCompetitorsPrompt } from '../../../lib/prompts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const verifyResult = verifyUser(req, res);

    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
        const { step, data } = req.body;
        const userId = verifyResult.userId;

        try {
            // Update User Onboarding Step
            await User.update({ onboarding_step: step }, { where: { id: userId } });

            if (step === 1 && data.website_url) {
                let domainUrl = data.website_url.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');
                const slug = domainUrl.replace(/\./g, '_');

                const existing = await Domain.findOne({ where: { domain: domainUrl, user_id: userId } });
                if (!existing) {
                    // Detect property type from GSC site URL
                    let propertyType = 'domain';
                    let propertyUrl = '';

                    if (data.gsc_site_url) {
                        const rawDomain = data.gsc_site_url.trim();
                        if (rawDomain.startsWith('https://') || rawDomain.startsWith('http://')) {
                            propertyType = 'url';
                            propertyUrl = rawDomain;
                        } else if (rawDomain.startsWith('sc-domain:')) {
                            propertyType = 'domain';
                            propertyUrl = '';
                        }
                    }

                    // Create search_console settings (same format as import)
                    const searchConsoleSettings = {
                        property_type: propertyType,
                        url: propertyUrl,
                        client_email: '',
                        private_key: ''
                    };

                    // Create domain with GSC settings
                    const domainData: any = {
                        domain: domainUrl,
                        slug: slug,
                        user_id: userId,
                        lastUpdated: new Date().toISOString(),
                        added: new Date().toISOString(),
                        search_console: JSON.stringify(searchConsoleSettings),
                    };

                    // Also store GSC site URL in search_console_data for reference
                    if (data.gsc_site_url) {
                        domainData.search_console_data = JSON.stringify({
                            gsc_site_url: data.gsc_site_url,
                            connected_at: new Date().toISOString()
                        });
                    }

                    await Domain.create(domainData);
                }

                // --- AI Analysis Logic ---
                try {
                    let fetchUrl = data.website_url;
                    if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;

                    const pageRes = await axios.get(fetchUrl, {
                        timeout: 15000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
                    });

                    const $ = cheerio.load(pageRes.data);
                    $('script, style, noscript, svg, img, iframe').remove();

                    const title = $('title').text().trim();
                    const metaDesc = $('meta[name="description"]').attr('content') || '';
                    const h1 = $('h1').text().trim();
                    // Get first 5000 chars of body text
                    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

                    const content = `Title: ${title}\nDescription: ${metaDesc}\nH1: ${h1}\nContent: ${bodyText}`;

                    // Call External AI (Enrichment)
                    console.log(`[ONBOARDING] Enriching data for: ${fetchUrl}`);
                    console.log(`[ONBOARDING] Using AI URL: ${process.env.SLM_API_URL}/api/company/enrich`);

                    const titleParts = title.split(/[-|]/);
                    let aiData = {
                        businessName: titleParts[0].trim(),
                        niche: titleParts[1]?.trim() || h1 || '',
                        description: metaDesc || ''
                    };

                    try {
                        const enrichRes = await axios.post(`${process.env.SLM_API_URL}/api/company/enrich`, {
                            website: fetchUrl
                        }, {
                            headers: {
                                'x-api-key': process.env.SLM_API_KEY,
                                'Content-Type': 'application/json'
                            }
                        });

                        console.log(`[ONBOARDING] AI Response Status: ${enrichRes.status}`);

                        if (enrichRes.data && enrichRes.data.about_company) {
                            console.log(`[ONBOARDING] AI Data Received:`, enrichRes.data.about_company.substring(0, 50) + "...");
                            aiData.description = enrichRes.data.about_company;

                            // If niche is still empty, try to extract it from the new description
                            if (!aiData.niche) {
                                const match = enrichRes.data.about_company.match(/(?:is a|is an|provides|specializes in) ([^.]+)/i);
                                if (match && match[1]) {
                                    aiData.niche = match[1].split(',')[0].trim().substring(0, 30);
                                }
                            }
                        }

                    } catch (apiError: any) {
                        console.error("[ONBOARDING] Enrichment API Failed:", apiError.message);
                        if (apiError.response) {
                            console.error("[ONBOARDING] API Error Body:", apiError.response.data);
                        }
                    }

                    return res.status(200).json({ success: true, aiData });

                } catch (scrapeError: any) {
                    // ... existing error handling
                    console.error("[ONBOARDING] Scraping/AI Failed:", scrapeError.message);
                    return res.status(200).json({ success: true });
                }
            }

            if (step === 2 && data.businessName) {
                // Step 2: Update Domain with business information
                const domain = await Domain.findOne({
                    where: { user_id: userId },
                    order: [['ID', 'DESC']]
                });

                if (domain) {
                    await domain.update({
                        business_name: data.businessName,
                        niche: data.niche,
                        description: data.description,
                    });

                    // Generate Keywords and Competitors locally from available data
                    try {
                        console.log('[ONBOARDING] Generating local keyword suggestions...');

                        const text = `${data.businessName} ${data.niche} ${data.description}`.toLowerCase();
                        const words = text.match(/\b\w{4,}\b/g) || [];
                        const uniqueWords = [...new Set(words)].filter(w => !['from', 'with', 'your', 'this', 'that', 'they'].includes(w));

                        const suggestedKeywords = {
                            high: [
                                data.niche,
                                `${data.businessName} ${data.niche}`,
                                uniqueWords[0] || 'Quality Services'
                            ].map(k => k.trim()).slice(0, 3),
                            medium: [
                                uniqueWords[1] || 'SEO Strategy',
                                uniqueWords[2] || 'Market Growth',
                                uniqueWords[3] || 'Digital Services'
                            ].slice(0, 3),
                            low: [
                                uniqueWords[4] || 'Online Presence',
                                uniqueWords[5] || 'Business Growth',
                                uniqueWords[6] || 'Client Success'
                            ].slice(0, 3)
                        };

                        const suggestedCompetitors = [
                            `${data.niche.replace(/\s+/g, '-')}-pros.com`,
                            `best-${data.niche.replace(/\s+/g, '-')}.net`,
                            "industry-leader.com"
                        ];

                        return res.status(200).json({
                            success: true,
                            suggestedKeywords,
                            suggestedCompetitors
                        });

                    } catch (e) {
                        console.error('Local suggestion generation failed:', e);
                        return res.status(200).json({
                            success: true,
                            suggestedKeywords: { high: [], medium: [], low: [] },
                            suggestedCompetitors: []
                        });
                    }
                }
            }

            if (step === 2.5 && data.focus_keywords) {
                // Step 2.5: Save focus keywords
                const domain = await Domain.findOne({
                    where: { user_id: userId },
                    order: [['ID', 'DESC']]
                });

                if (domain) {
                    await domain.update({
                        focus_keywords: data.focus_keywords,
                        target_country: data.target_country || 'US',
                    });

                    // ---------------------------------------------------------
                    // Auto-Add Keywords to Tracking (Desktop, Tag: Target)
                    // ---------------------------------------------------------
                    const targetCountry = data.target_country || 'US';
                    const allFocusKeywords = [
                        ...(data.focus_keywords.high || []),
                        ...(data.focus_keywords.medium || []),
                        ...(data.focus_keywords.low || [])
                    ].filter((k: any) => k && k.trim() !== '');

                    if (allFocusKeywords.length > 0 && domain.domain) {
                        try {
                            const keywordsToAdd = allFocusKeywords.map((k: string) => ({
                                keyword: k.trim(),
                                device: 'desktop',
                                country: targetCountry,
                                domain: domain.domain, // Ensure domain is available
                                user_id: userId,
                                tags: JSON.stringify(['Target']), // Add "Target" tag
                                position: 0,
                                updating: true,
                                history: JSON.stringify({}),
                                url: '',
                                sticky: false,
                                added: new Date().toJSON(),
                                lastUpdated: new Date().toJSON(),
                            }));

                            // Bulk Create
                            const newKeywords = await Keyword.bulkCreate(keywordsToAdd);

                            // Trigger Rank Refresh
                            const settings = await getAppSettings(userId);
                            refreshAndUpdateKeywords(newKeywords, settings);

                            console.log(`[INFO] Auto-added ${newKeywords.length} focus keywords to tracking.`);

                        } catch (err) {
                            console.error('[ERROR] Failed to auto-add focus keywords:', err);
                            // Don't fail the request, just log error
                        }
                    }
                }
            }

            if (step === 3 && data.competitors) {
                // Step 3: Update Domain with competitors
                const domain = await Domain.findOne({
                    where: { user_id: userId },
                    order: [['ID', 'DESC']]
                });

                if (domain) {
                    await domain.update({
                        competitors: data.competitors,
                    });
                }
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Onboarding Save Error:', error);
            return res.status(500).json({ error: 'Database Error' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
