/**
 * OAuth Scopes Catalog
 * --------------------
 * Standard OAuth 2.0 scope strings clients can request.
 * Each scope maps to a human-readable description (shown on the consent screen)
 * and a permission level the access token will hold.
 */

export const OAUTH_SCOPES = {
    'read:profile': {
        label: 'View your profile',
        description: 'Read your name, email, profile picture and the workspace you choose.'
    },
    'read:domains': {
        label: 'View your domains',
        description: 'List the domains in your selected workspace and their basic settings.'
    },
    'write:domains': {
        label: 'Manage your domains',
        description: 'Add, edit and remove domains in your selected workspace.'
    },
    'read:gsc': {
        label: 'View Google Search Console data',
        description: 'Read aggregated GSC stats, keywords, pages and countries.'
    },
    'read:keywords': {
        label: 'View tracked keywords',
        description: 'List keywords being tracked and their position history.'
    },
    'write:keywords': {
        label: 'Manage tracked keywords',
        description: 'Add, edit and remove tracked keywords in your workspace.'
    },
    'read:analytics': {
        label: 'View analytics and reports',
        description: 'Access aggregated analytics, reports and trends.'
    }
} as const;

export type OAuthScope = keyof typeof OAUTH_SCOPES;

export const ALL_SCOPES = Object.keys(OAUTH_SCOPES) as OAuthScope[];

export function isValidScope(scope: string): scope is OAuthScope {
    return scope in OAUTH_SCOPES;
}

export function parseScopes(input: string | string[] | undefined): OAuthScope[] {
    if (!input) return [];
    const arr = Array.isArray(input) ? input : String(input).split(/[\s,]+/);
    return arr.filter(isValidScope) as OAuthScope[];
}

export function describeScopes(scopes: string[]) {
    return scopes
        .filter(isValidScope)
        .map((s) => ({ scope: s, ...OAUTH_SCOPES[s as OAuthScope] }));
}
