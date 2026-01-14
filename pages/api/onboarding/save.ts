import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../../../database/database';
import User from '../../../database/models/user';
import verifyUser from '../../../utils/verifyUser';
import Domain from '../../../database/models/domain';

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

                    // Call Local AI
                    const aiRes = await axios.post('http://127.0.0.1:38474/v1/chat/completions', {
                        model: "qwen",
                        messages: [
                            { role: "system", content: "You are an expert SEO Strategist and Business Analyst. Your goal is to analyze website content and extract high-quality business information for a directory listing. Respond ONLY with valid JSON." },
                            {
                                role: "user", content: `Analyze the provided website content and extract the following details in JSON format:

{
  "businessName": "The official brand name of the business",
  "niche": "Impactful and specific market niche (max 4 words). Avoid generic terms (e.g. instead of 'Software', use 'AI Recruitment Platform')",
  "description": "A professional, compelling business summary (max 300 chars). Focus on the core value proposition: What they do, who they serve, and the main benefit."
}

Instructions:
- If specific info is missing, deduce the best possible answer from the context.
- Keep the 'niche' specific and SEO-friendly.
- Keep the 'description' engaging and professional.

Website Content:
${content}`
                            }
                        ],
                        temperature: 0.2, // Slightly increased for creativity
                        max_tokens: 500,
                        response_format: { type: "json_object" }
                    });

                    let aiData = null;
                    if (aiRes.data?.choices?.[0]?.message?.content) {
                        try {
                            const raw = aiRes.data.choices[0].message.content;
                            // Clean markdown code blocks if present
                            const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
                            aiData = JSON.parse(jsonStr);
                        } catch (e) {
                            console.error("Failed to parse AI JSON", e);
                        }
                    }

                    return res.status(200).json({ success: true, aiData });

                } catch (scrapeError) {
                    console.error("Scraping/AI Failed:", scrapeError);
                    // Continue without AI data
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

                    // AI Suggest Competitors (Internal Logic - No External Scraper Token)
                    try {
                        const aiRes = await axios.post('http://127.0.0.1:38474/v1/chat/completions', {
                            model: "qwen",
                            messages: [
                                { role: "system", content: "You are an SEO expert. Respond ONLY with a valid JSON array of strings." },
                                {
                                    role: "user", content: `List 5 top real-world competitor domains for the niche: "${data.niche}". 
                                Simulate a comprehensive Google, Trustpilot, and G2 search to find the most relevant and popular active competitors.
                                Return ONLY a JSON array of domain names (e.g. ["competitor1.com", "example.net"]). Do not number them.` }
                            ],
                            temperature: 0.3,
                            max_tokens: 200
                        });

                        let suggestedCompetitors = [];
                        if (aiRes.data?.choices?.[0]?.message?.content) {
                            const raw = aiRes.data.choices[0].message.content;
                            const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
                            suggestedCompetitors = JSON.parse(jsonStr);
                        }

                        return res.status(200).json({ success: true, suggestedCompetitors });

                    } catch (e) {
                        // Fallback if AI fails
                        return res.status(200).json({ success: true, suggestedCompetitors: [] });
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
