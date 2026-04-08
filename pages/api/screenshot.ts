import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Screenshot endpoint — DISABLED for cPanel deployment.
 *
 * The original implementation used Puppeteer to launch a headless Chromium
 * instance and capture a screenshot of the given domain. This requires
 * Chromium + 40+ system libraries which are NOT available on shared hosting
 * (cPanel). To keep the deployment footprint minimal, the endpoint now
 * returns a 501 Not Implemented. Clients should fall back to a placeholder
 * thumbnail (e.g. /dpro_logo.png) or integrate a third-party screenshot
 * service such as screenshotapi.net / urlbox.io if this feature is needed.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
    }

    return res.status(501).json({
        error: 'Screenshot feature is disabled on this deployment.',
        hint: 'Configure an external screenshot service or run the project on a VPS with Chromium to re-enable.'
    });
}
