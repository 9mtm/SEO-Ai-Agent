import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPlatformAdapter } from '../../../utils/platformAdapters';
import User from '../../../database/models/user';
import PlatformIntegration from '../../../database/models/platformIntegration';
import connection from '../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const platformType = req.headers['x-platform-type'] as string;
    const adapter = getPlatformAdapter(platformType);

    if (!adapter) {
        return res.status(400).json({ success: false, error: 'Invalid platform type' });
    }

    try {
        await connection.sync();

        // ============================================
        // 1. VALIDATION (Revised for Dynamic Secrets)
        // ============================================
        // ============================================
        // 1. VALIDATION (Revised for Dynamic Secrets)
        // ============================================
        let isValid = false;
        let existingIntegration: PlatformIntegration | null = null;

        if (platformType === 'wordpress') {
            // WordPress: Lookup Secret from Database (Dynamic)
            const requestSecret = req.headers['x-platform-secret'] as string;
            const domain = req.headers['x-platform-domain'] || req.headers['origin'];

            existingIntegration = await PlatformIntegration.findOne({
                where: {
                    platform_type: 'wordpress',
                    platform_domain: domain,
                },
                include: [User]
            });

            // Double check secret matched
            if (existingIntegration && existingIntegration.shared_secret === requestSecret) {
                isValid = true;
            } else {
                // Try looking up by secret directly if domain mismatch (flexible lookup)
                const secretMatch = await PlatformIntegration.findOne({
                    where: { shared_secret: requestSecret, platform_type: 'wordpress' },
                    include: [User]
                });
                if (secretMatch) {
                    existingIntegration = secretMatch;
                    isValid = true;
                } else {
                    console.log(`[Auth Fail] WordPress Secret Mismatch for domain: ${domain}`);
                }
            }
        } else {
            // Shopify/Wix: Use Static App Secret (Standard)
            isValid = await adapter.validateRequest(req);
        }

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials or secret' });
        }

        // ============================================
        // 2. NORMALIZE USER
        // ============================================
        const userData = adapter.normalizeUser(req.body);

        // ============================================
        // 3. DATABASE OPERATIONS (Common)
        // ============================================

        // If we already found the integration during validation, USE THAT USER
        let user;
        let integration = existingIntegration;

        if (integration && integration.user) {
            user = integration.user;
        } else {
            // Fallback: Find existing user by email (Only for non-secret-bound flows or initial setup if passed differently)
            // But for WP, we should really have found it above if valid.

            // Try to find integration again if not found above (e.g. Shopify/Wix)
            if (!integration) {
                integration = await PlatformIntegration.findOne({
                    where: {
                        platform_type: platformType,
                        platform_user_id: userData.platform_user_id,
                        platform_domain: req.headers['x-platform-domain'] || req.headers['origin'] || 'unknown',
                    },
                    include: [User]
                });
            }

            if (integration && integration.user) {
                user = integration.user;
            } else {
                // Find existing user by email
                user = await User.findOne({ where: { email: userData.email } });

                if (!user) {
                    // Auto-Register
                    user = await User.create({
                        name: userData.name,
                        email: userData.email,
                        password: await import('bcryptjs').then(bcrypt => bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)),
                        platform_type: platformType,
                        platform_user_id: userData.platform_user_id,
                        platform_metadata: userData.metadata,
                        is_active: true,
                        subscription_plan: 'free',
                    });
                } else {
                    // Link existing
                    if (!user.platform_user_id) {
                        /* 
                           Warning: This links by email. If WP email != FlowXtra email, this path is taken
                           only if integration was NOT found.
                        */
                        await user.update({
                            platform_type: platformType,
                            platform_user_id: userData.platform_user_id
                        });
                    }
                }

                // Create Integration if missing
                if (!integration) {
                    integration = await PlatformIntegration.create({
                        user_id: user.id,
                        platform_type: platformType,
                        platform_domain: req.headers['x-platform-domain'] || req.headers['origin'] || 'unknown',
                        platform_user_id: userData.platform_user_id,
                        shared_secret: req.headers['x-platform-secret'] as string || '',
                        platform_metadata: userData.metadata,
                        is_active: true
                    });
                }
            }
        }

        // 4. Generate Token
        if (!process.env.SECRET) throw new Error('Server misconfiguration: SECRET missing');

        const tokenPayload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            platform_type: platformType,
            platform_integration_id: integration.id
        };

        const token = jwt.sign(tokenPayload, process.env.SECRET, { expiresIn: '365d' }); // 1 year for platform integrations

        // Update stats
        await user.update({ last_login: new Date() });
        await integration.update({ last_login: new Date() });

        return res.status(200).json({
            success: true,
            token,
            user_id: user.id,
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/platform-sso?token=${token}&platform=${platformType}`
        });

    } catch (error: any) {
        console.error('SSO Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
    }
}
