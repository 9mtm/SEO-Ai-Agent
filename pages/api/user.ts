import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import verifyUser from '../../utils/verifyUser';
import sequelize from '../../database/database';
import User from '../../database/models/user';
import Domain from '../../database/models/domain';
import InvoiceDetail from '../../database/models/invoiceDetail';

type UserInfoResponse = {
    success: boolean;
    user?: {
        name: string;
        email: string;
        picture?: string;
        ai_api_keys?: any;
        language?: string;
        subscription_plan?: string;
        stripe_customer_id?: string;
        stripe_subscription_id?: string;
        stripe_current_period_end?: Date;
        invoice_details?: any;
    };
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<UserInfoResponse>) {
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Initialize database connection
        await sequelize.sync();

        const verifyResult = verifyUser(req, res);

        if (!verifyResult.authorized || !verifyResult.userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const user = await User.findByPk(verifyResult.userId, {
            include: [InvoiceDetail]
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (req.method === 'GET') {
            // Get user data including Google profile picture
            const userData: any = user.toJSON();

            return res.status(200).json({
                success: true,
                user: {
                    name: user.name || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    picture: userData.google_picture || userData.picture || undefined,
                    ai_api_keys: userData.ai_api_keys,
                    language: user.language || 'en',
                    subscription_plan: user.subscription_plan || 'free',
                    stripe_customer_id: user.stripe_customer_id,
                    stripe_subscription_id: user.stripe_subscription_id,
                    stripe_current_period_end: user.stripe_current_period_end,
                    invoice_details: user.invoice_profile ? {
                        type: user.invoice_profile.type,
                        companyName: user.invoice_profile.name,
                        vatId: user.invoice_profile.vat_id,
                        address: user.invoice_profile.address,
                        email: user.invoice_profile.email
                    } : undefined
                }
            });
        }

        if (req.method === 'DELETE') {
            // Delete all domains associated with the user
            await Domain.destroy({ where: { user_id: user.id } });

            // Delete the user
            await user.destroy();

            // Clear the cookie
            const cookies = new Cookies(req, res);
            cookies.set('token', null, { expires: new Date(0) });

            return res.status(200).json({ success: true });
        }

        if (req.method === 'PUT') {
            const { name, ai_api_keys, language, invoice_details } = req.body;

            if (name) user.name = name;
            if (ai_api_keys) user.ai_api_keys = ai_api_keys;
            if (language) user.language = language;

            await user.save();

            if (invoice_details) {
                const [profile, created] = await InvoiceDetail.findOrCreate({
                    where: { user_id: user.id },
                    defaults: {
                        user_id: user.id,
                        type: invoice_details.type || 'company',
                        name: invoice_details.companyName,
                        vat_id: invoice_details.vatId,
                        address: invoice_details.address,
                        email: invoice_details.email
                    }
                });

                if (!created) {
                    profile.type = invoice_details.type || profile.type;
                    profile.name = invoice_details.companyName || profile.name;
                    profile.vat_id = invoice_details.vatId || profile.vat_id;
                    profile.address = invoice_details.address || profile.address;
                    profile.email = invoice_details.email || profile.email;
                    await profile.save();
                }
            }

            return res.status(200).json({ success: true, user: user.toJSON() as any });
        }

    } catch (error) {
        console.error('Error in user handler:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
