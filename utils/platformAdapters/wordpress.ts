import { PlatformAdapter, PlatformUserData, NormalizedUser } from './types';
import PlatformIntegration from '../../database/models/platformIntegration';

export class WordPressAdapter implements PlatformAdapter {

    constructor() {
        // No global secret for WordPress
    }

    // Use Database Check for WordPress (Dynamic Secrets)
    // We return 'true' here to bypass the static check, but the Handler MUST perform the DB check.
    // Alternatively, we could inject the DB record here if we refactored.
    // For now, we return true and let sso-token.ts handle the DB lookup logic for WordPress specifically.
    async validateRequest(req: any): Promise<boolean> {
        // Validation for WordPress is 'Stateful' (requires DB lookup of the specific domain's secret)
        // The main handler will perform this check.
        return true;
    }

    normalizeUser(data: PlatformUserData): NormalizedUser {
        const wpRole = data.role || 'subscriber';

        return {
            platform_user_id: String(data.id),
            name: data.name,
            email: data.email,
            role: wpRole === 'administrator' ? 'admin' : 'user',
            metadata: {
                original_role: wpRole,
                site_url: data.site_url
            }
        };
    }
}
