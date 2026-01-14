import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../utils/verifyUser';
import sequelize from '../../database/database';
import User from '../../database/models/user';

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
    if (req.method !== 'GET') {
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
    } catch (error) {
        console.error('Error fetching user info:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
