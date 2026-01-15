import axios from 'axios';

type WPConnectionSettings = {
    url: string;
    username: string;
    app_password: string;
};

type WPPostData = {
    title: string;
    content: string;
    status?: 'publish' | 'draft' | 'pending';
    slug?: string;
    excerpt?: string;
    categories?: number[]; // IDs
    tags?: number[]; // IDs
    featured_media?: number; // ID
};

// Helper to format URL
const formatUrl = (url: string) => {
    let formatted = url.trim();
    if (!formatted.startsWith('http')) {
        formatted = `https://${formatted}`;
    }
    return formatted.replace(/\/$/, '');
};

// Helper for headers
const getAuthHeaders = (settings: WPConnectionSettings) => {
    // We retain this helper for other functions that might need raw headers, 
    // but verifyWordPressConnection will use axios auth config directly.
    const token = Buffer.from(`${settings.username}:${settings.app_password.replace(/\s/g, '')}`).toString('base64');
    return {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SEO-Agent/1.0',
    };
};

/**
 * Verify WordPress credentials by fetching user info
 */
export const verifyWordPressConnection = async (settings: WPConnectionSettings) => {
    try {
        const baseUrl = formatUrl(settings.url);
        const headers = getAuthHeaders(settings);

        console.log(`[WP Connection] Attempting to connect to ${baseUrl}/wp-json/wp/v2/users/me`);
        console.log(`[WP Connection] Using username: ${settings.username}`);

        const response = await axios.get(`${baseUrl}/wp-json/wp/v2/users/me`, {
            headers: headers,
            maxRedirects: 0, // Don't follow redirects - they strip auth headers
            validateStatus: (status) => status < 500 // Resolve promise for 4xx to handle logic below
        });

        if (response.status === 200) {
            console.log('[WP Connection] ✓ Connection successful!');
            return { success: true, user: response.data };
        }

        if (response.status === 401 || response.status === 403) {
            console.error('[WP Connection] ✗ Auth Failed (401/403). Headers likely stripped by server configuration.');
            return { success: false, error: 'Authentication failed. Please verify Username and App Password are correct, and check .htaccess configuration.' };
        }

        return { success: false, error: `Invalid response: Status ${response.status}` };
    } catch (error: any) {
        // Handle redirect errors (status 3xx)
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const redirectUrl = error.response.headers.location || 'unknown';
            console.error(`[WP Connection] ✗ Redirect detected to: ${redirectUrl}`);
            console.error('[WP Connection] Redirects strip Authorization headers. Please ensure URL is exact (http/https, www/non-www).');
            return { success: false, error: `Connection redirected to ${redirectUrl}. Please use the exact URL without redirects.` };
        }

        console.error('WordPress Connection Error Full:', JSON.stringify(error?.response?.data || {}, null, 2));
        console.error('WordPress Connection Status:', error?.response?.status);

        const msg = error?.response?.data?.message || error.message;
        return { success: false, error: msg };
    }
};


/**
 * Publish a post to WordPress
 */
export const publishToWordPress = async (settings: WPConnectionSettings, postData: WPPostData) => {
    try {
        const baseUrl = formatUrl(settings.url);
        const headers = getAuthHeaders(settings);

        const payload = {
            title: postData.title,
            content: postData.content,
            status: postData.status || 'draft',
            ...(postData.slug && { slug: postData.slug }),
            ...(postData.excerpt && { excerpt: postData.excerpt }),
            ...(postData.categories && { categories: postData.categories }),
            ...(postData.tags && { tags: postData.tags }),
            ...(postData.featured_media && { featured_media: postData.featured_media }),
        };

        const response = await axios.post(`${baseUrl}/wp-json/wp/v2/posts`, payload, { headers });

        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('WordPress Publish Error:', error?.response?.data || error.message);
        const msg = error?.response?.data?.message || error.message;
        return { success: false, error: msg };
    }
};

/**
 * Fetch Categories to help with mapping
 */
export const getWordPressCategories = async (settings: WPConnectionSettings) => {
    try {
        const baseUrl = formatUrl(settings.url);
        const headers = getAuthHeaders(settings);

        const response = await axios.get(`${baseUrl}/wp-json/wp/v2/categories?per_page=100`, { headers });

        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
