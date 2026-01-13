import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') return res.status(400).json({ error: 'Domain is required' });

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const buffer = await page.screenshot({ type: 'jpeg', quality: 60 });
        await browser.close();

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (error) {
        console.error('Screenshot error:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Failed to capture screenshot' });
    }
}
