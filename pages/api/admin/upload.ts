import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import db from '../../../database/database';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    await db.sync();

    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });
    const admin: any = await User.findByPk(auth.userId);
    if (!admin?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

    const { image, filename } = req.body;
    if (!image || !filename) return res.status(400).json({ error: 'image and filename required' });

    // image is base64 data URL: "data:image/png;base64,iVBOR..."
    const matches = image.match(/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid image format. Use PNG, JPG, GIF, WebP or SVG.' });

    const ext = matches[1].replace('+xml', '');
    const data = Buffer.from(matches[2], 'base64');
    const safeName = filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
    const uniqueName = `${Date.now()}-${safeName}.${ext === 'jpeg' ? 'jpg' : ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    fs.writeFileSync(path.join(uploadDir, uniqueName), data);

    const url = `/uploads/blog/${uniqueName}`;
    return res.status(200).json({ url });
}
