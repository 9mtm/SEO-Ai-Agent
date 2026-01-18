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
import { getPlanLimits } from '../../../utils/planLimits';

/**
 * Retry utility for API calls with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.log(`[RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Extract global industry niche (1-2 words max)
 */
function extractNicheFromDescription(description: string, title: string, fallback: string): string {
    const text = `${description} ${title} ${fallback}`.toLowerCase();

    // Map keywords to standard global niches (1-2 words)
    const nicheMap: { [key: string]: string } = {
        // HR & Recruiting
        'recruit': 'Recruiting',
        'talent': 'Recruiting',
        'hiring': 'Recruiting',
        'ats': 'Recruiting',
        'applicant': 'Recruiting',
        'hr': 'HR Tech',
        'human resource': 'HR Tech',
        'payroll': 'HR Tech',

        // Sales & Marketing
        'crm': 'CRM',
        'customer relationship': 'CRM',
        'sales': 'Sales',
        'marketing': 'Marketing',
        'email marketing': 'Marketing',
        'seo': 'Marketing',

        // E-commerce & Retail
        'ecommerce': 'E-commerce',
        'e-commerce': 'E-commerce',
        'online store': 'E-commerce',
        'retail': 'Retail',
        'shopping': 'E-commerce',

        // Finance & Accounting
        'accounting': 'Accounting',
        'bookkeeping': 'Accounting',
        'finance': 'Finance',
        'invoice': 'Accounting',
        'payment': 'Payments',

        // Project & Productivity
        'project management': 'Project Management',
        'task management': 'Productivity',
        'productivity': 'Productivity',
        'collaboration': 'Collaboration',
        'workflow': 'Productivity',

        // Tech & Development
        'analytics': 'Analytics',
        'data': 'Analytics',
        'software development': 'Dev Tools',
        'devops': 'DevOps',
        'cloud': 'Cloud',

        // Design & Creative
        'design': 'Design',
        'graphic': 'Design',
        'video': 'Video',
        'photo': 'Photography',

        // Communication
        'communication': 'Communication',
        'messaging': 'Communication',
        'video conference': 'Video Conferencing',
        'chat': 'Communication',

        // Education
        'education': 'Education',
        'learning': 'E-learning',
        'course': 'E-learning',
        'training': 'Training',

        // Real Estate & Property
        'real estate': 'Real Estate',
        'property': 'Real Estate',

        // Healthcare
        'health': 'Healthcare',
        'medical': 'Healthcare',
        'clinic': 'Healthcare',

        // Legal
        'legal': 'Legal',
        'law': 'Legal',
        'contract': 'Legal Tech'
    };

    // Find matching niche
    for (const [keyword, niche] of Object.entries(nicheMap)) {
        if (text.includes(keyword)) {
            return niche;
        }
    }

    // Fallback: Extract first meaningful word
    const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w =>
            w.length > 3 &&
            !['free', 'best', 'top', 'new', 'the', 'this', 'that', 'with', 'for', 'and'].includes(w)
        );

    if (words.length > 0) {
        // Capitalize first word
        return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }

    return 'SaaS';
}

/**
 * Generate professional SEO keywords based on business information
 */
function generateProfessionalKeywords(
    businessName: string,
    niche: string,
    description: string
): { high: string[], medium: string[], low: string[] } {
    const cleanNiche = niche.trim().toLowerCase();
    const cleanBusiness = businessName.trim().toLowerCase();

    // Extract meaningful feature words from description
    const descWords = description
        .toLowerCase()
        .match(/\b[a-z]{4,}\b/g) || [];

    const stopWords = ['from', 'with', 'your', 'this', 'that', 'they', 'have', 'will',
        'been', 'their', 'about', 'which', 'there', 'would', 'could',
        'should', 'these', 'those', 'more', 'some', 'than', 'into',
        'cutting', 'edge', 'designed', 'help', 'ensure', 'platform',
        'solution', 'system', 'tool'];

    const features = [...new Set(descWords)]
        .filter(w => !stopWords.includes(w) && w.length > 3)
        .slice(0, 8);

    // HIGH PRIORITY: Core category keywords
    const high: string[] = [
        cleanNiche, // "recruiting"
        `${cleanNiche} software`, // "recruiting software"
        `best ${cleanNiche} software` // "best recruiting software"
    ];

    // MEDIUM PRIORITY: Brand + features
    const medium: string[] = [
        `${cleanBusiness}`, // "flowxtra"
        `${cleanNiche} platform`, // "recruiting platform"
        `free ${cleanNiche} software` // "free recruiting software"
    ];

    // Add feature if available
    if (features[0]) {
        medium.push(`${cleanNiche} ${features[0]}`); // "recruiting management"
    }

    // LOW PRIORITY: Long-tail variations
    const low: string[] = [
        `${cleanNiche} tools`, // "recruiting tools"
        `${cleanNiche} for small business`, // "recruiting for small business"
        `top ${cleanNiche} platforms` // "top recruiting platforms"
    ];

    // Add more features
    if (features[1]) {
        low.push(`${features[1]} ${cleanNiche}`); // "talent recruiting"
    }
    if (features[2]) {
        low.push(`${cleanNiche} ${features[2]}`); // "recruiting hiring"
    }

    return {
        high: high.filter(k => k && k.length > 2 && k.length < 40).slice(0, 3),
        medium: medium.filter(k => k && k.length > 2 && k.length < 50).slice(0, 3),
        low: low.filter(k => k && k.length > 2 && k.length < 60).slice(0, 3)
    };
}

/**
 * Generate competitor search suggestions (generic for any niche)
 */
function generateCompetitorSuggestions(niche: string): string[] {
    const cleanNiche = niche.trim();

    // Return actionable search suggestions that work for ANY niche
    return [
        `Search "${cleanNiche}" on G2.com`,
        `Search "${cleanNiche}" on Capterra.com`,
        `Google: "best ${cleanNiche}"`,
        `Search "${cleanNiche}" on AlternativeTo.net`,
        `Check reviews on Trustpilot for ${cleanNiche}`
    ];
}

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
                // Check Domain Limit
                const user = await User.findByPk(userId);
                const limit = getPlanLimits(user?.subscription_plan || 'free').domains;
                const currentCount = await Domain.count({ where: { user_id: userId } });

                // If domain exists, we findOne later, but if we are creating new one...
                let domainUrl = data.website_url.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');
                const existing = await Domain.findOne({ where: { domain: domainUrl, user_id: userId } });

                if (!existing && currentCount >= limit) {
                    return res.status(403).json({ error: `Domain limit reached (${limit}). Please upgrade your plan.` });
                }

                const slug = domainUrl.replace(/\./g, '_');
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

                    console.log(`[ONBOARDING] Analyzing website: ${fetchUrl}`);
                    console.log(`[ONBOARDING] Using AI API: ${process.env.SLM_API_URL}/api/onboarding/analyze`);

                    let aiData = {
                        businessName: '',
                        niche: '',
                        description: ''
                    };

                    let suggestedKeywords: { high: string[], medium: string[], low: string[] } = { high: [], medium: [], low: [] };
                    let suggestedCompetitors: string[] = [];

                    if (process.env.SLM_API_URL && process.env.SLM_API_KEY) {
                        try {
                            const analyzeRes = await retryWithBackoff(async () => {
                                return await axios.post(`${process.env.SLM_API_URL}/api/onboarding/analyze`, {
                                    website: fetchUrl
                                }, {
                                    headers: {
                                        'x-api-key': process.env.SLM_API_KEY,
                                        'Content-Type': 'application/json'
                                    },
                                    timeout: 30000  // 30 seconds for scraping + AI
                                });
                            }, 2, 3000);

                            console.log(`[ONBOARDING] ✅ AI Response Status: ${analyzeRes.status}`);

                            if (analyzeRes.data && analyzeRes.data.success) {
                                aiData.businessName = analyzeRes.data.businessName || '';
                                aiData.description = analyzeRes.data.description || '';
                                aiData.niche = analyzeRes.data.niche || '';

                                // Extract keywords and competitors from AI response
                                suggestedKeywords = analyzeRes.data.keywords || { high: [], medium: [], low: [] };
                                suggestedCompetitors = analyzeRes.data.competitors || [];
                            } else {
                                throw new Error('AI API returned invalid response');
                            }

                        } catch (apiError: any) {
                            console.error("[ONBOARDING] ⚠️ AI Analysis Failed:", apiError.message);
                            if (apiError.response) {
                                console.error("[ONBOARDING] API Error:", apiError.response.data);
                            }

                            // Fallback: Basic scraping
                            console.log('[ONBOARDING] Using fallback scraping...');
                            try {
                                const pageRes = await axios.get(fetchUrl, {
                                    timeout: 15000,
                                    headers: { 'User-Agent': 'Mozilla/5.0' }
                                });

                                const $ = cheerio.load(pageRes.data);
                                const title = $('title').text().trim();
                                const metaDesc = $('meta[name="description"]').attr('content') || '';
                                const h1 = $('h1').text().trim();

                                const titleParts = title.split(/[-|]/);
                                aiData.businessName = titleParts[0].trim();
                                aiData.description = metaDesc || h1 || title;
                                aiData.niche = extractNicheFromDescription(aiData.description, title, titleParts[1]?.trim() || h1);

                                // Generate fallback keywords and competitors
                                suggestedKeywords = generateProfessionalKeywords(aiData.businessName, aiData.niche, aiData.description);
                                suggestedCompetitors = generateCompetitorSuggestions(aiData.niche);
                            } catch (scrapeError) {
                                console.error('[ONBOARDING] Fallback scraping also failed');
                            }
                        }
                    } else {
                        console.log('[ONBOARDING] ⚠️ AI API not configured');
                        return res.status(500).json({ success: false, error: 'AI API not configured' });
                    }

                    return res.status(200).json({
                        success: true,
                        aiData,
                        suggestedKeywords,
                        suggestedCompetitors
                    });

                } catch (error: any) {
                    console.error("[ONBOARDING] Fatal error:", error.message);
                    return res.status(500).json({ success: false, error: error.message });
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

                    // Keywords and Competitors were already set in Step 1
                    // Don't return them here to avoid overwriting with empty arrays
                    return res.status(200).json({
                        success: true,
                        niche: data.niche
                    });
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

                    // Check Keyword Limits
                    const user = await User.findByPk(userId);
                    const limit = getPlanLimits(user?.subscription_plan || 'free').keywords;
                    const currentCount = await Keyword.count({ where: { user_id: userId } });

                    if (currentCount + allFocusKeywords.length > limit) {
                        return res.status(403).json({
                            error: `Plan Limit Reached: Your plan allows ${limit} keywords. You have ${currentCount} and are trying to add ${allFocusKeywords.length}. (Total: ${currentCount + allFocusKeywords.length}). Please remove some keywords or upgrade.`
                        });
                    }

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
