export interface PlatformUserData {
    id: string | number;
    email: string;
    name: string;
    role?: string;        // WordPress
    permissions?: string[]; // Shopify
    role_id?: string;     // Wix
    [key: string]: any;
}

export interface NormalizedUser {
    platform_user_id: string;
    name: string;
    email: string;
    role: string; // Internal role mapping
    metadata: any;
}

export interface PlatformAdapter {
    validateRequest(req: any): Promise<boolean>;
    normalizeUser(data: PlatformUserData): NormalizedUser;
}
