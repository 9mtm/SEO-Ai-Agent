import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import verifyUser from '../../utils/verifyUser';
import sequelize from '../../database/database';
import User from '../../database/models/user';
import Domain from '../../database/models/domain';

type UserInfoResponse = {
    success: boolean;
    user?: {
        name: string;
        email: string;
        picture?: string;
    };
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<UserInfoResponse>) {
    if (req.method !== 'GET' && req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Initialize database connection
        await sequelize.sync();

        const verifyResult = verifyUser(req, res);

        if (!verifyResult.authorized || !verifyResult.userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const user = await User.findByPk(verifyResult.userId);

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
                    picture: userData.google_picture || userData.picture || undefined
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

    } catch (error) {
        console.error('Error in user handler:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
