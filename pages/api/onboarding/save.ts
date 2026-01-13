import type { NextApiRequest, NextApiResponse } from 'next';
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
                    await Domain.create({
                        domain: domainUrl,
                        slug: slug,
                        user_id: userId,
                        lastUpdated: new Date().toISOString(),
                        added: new Date().toISOString(),
                    });
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
                        language: data.language,
                        blog_url: data.blogUrl,
                    });
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
