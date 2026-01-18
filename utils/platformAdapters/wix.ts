import { PlatformAdapter, PlatformUserData, NormalizedUser } from './types';

export class WixAdapter implements PlatformAdapter {
    private secret: string;

    constructor() {
        this.secret = process.env.PLATFORM_WIX_SECRET || '';
    }

    async validateRequest(req: any): Promise<boolean> {
        const requestSecret = req.headers['x-platform-secret'];
        return requestSecret === this.secret;
    }

    normalizeUser(data: PlatformUserData): NormalizedUser {
        // Wix roles often come as IDs or permission sets
        // Checks if the user is an owner or contributor
        const isOwner = data.role === 'OWNER' || data.role_id === 'OWNER';

        return {
            platform_user_id: String(data.id),
            name: data.name,
            email: data.email,
            role: isOwner ? 'admin' : 'user',
            metadata: {
                role_id: data.role_id,
                instanceId: data.instanceId
            }
        };
    }
}
