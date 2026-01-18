import { PlatformAdapter, PlatformUserData, NormalizedUser } from './types';

export class ShopifyAdapter implements PlatformAdapter {
    private secret: string;

    constructor() {
        this.secret = process.env.PLATFORM_SHOPIFY_SECRET || '';
    }

    async validateRequest(req: any): Promise<boolean> {
        const requestSecret = req.headers['x-platform-secret'];
        // Shopify often uses HMAC validation, but for this custom integration/app, 
        // we use a shared secret approach for simplicity in the Custom App
        return requestSecret === this.secret;
    }

    normalizeUser(data: PlatformUserData): NormalizedUser {
        // Determine role based on permissions or strict check
        // Assuming data.permissions includes 'write_products' etc.
        const isAdmin = data.permissions && data.permissions.includes('full_access');

        return {
            platform_user_id: String(data.id),
            name: data.name,
            email: data.email,
            role: isAdmin ? 'admin' : 'user',
            metadata: {
                permissions: data.permissions,
                shop: data.shop
            }
        };
    }
}
