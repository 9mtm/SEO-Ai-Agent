import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';
import User from '../../../../database/models/user';
import Domain from '../../../../database/models/domain';
import connection from '../../../../database/database';
import { ensurePersonalWorkspace } from '../../../../utils/createPersonalWorkspace';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google Auth Error:', error);
    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=google_auth_failed`);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  try {
    await connection.sync();

    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to retrieve access token from Google');
    }

    // Parse State
    let flow = state;
    let returnUrl = null;

    try {
      if (typeof state === 'string' && state.startsWith('{')) {
        const stateObj = JSON.parse(state);
        flow = stateObj.flow;
        returnUrl = stateObj.returnUrl;
      }
    } catch (e) {
      console.error('Error parsing state:', e);
    }

    // ---------------------------------------------------------
    // FLOW A: CONNECT ACCOUNT (Authenticated User adding GSC)
    // ---------------------------------------------------------
    if (flow === 'connect_flow') {
      const cookies = new Cookies(req, res);
      const connectingUserId = cookies.get('oauth_connecting_user');

      if (!connectingUserId) {
        return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=session_expired`);
      }

      const user = await User.findByPk(parseInt(connectingUserId));
      if (!user) {
        return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=user_not_found`);
      }

      // Calculate expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expires_in || 3599));

      // Update User with GSC Tokens
      await user.update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token, // Only strictly present if prompt=consent was used
        google_token_expiry: expiryDate,
      });

      // Clean up cookies
      const cookieReturnUrl = cookies.get('oauth_return_url');
      cookies.set('oauth_connecting_user', '', { maxAge: 0 });
      cookies.set('oauth_return_url', '', { maxAge: 0 });

      // Redirect to return URL or default to Settings page
      const defaultRedirect = `${process.env.NEXT_PUBLIC_APP_URL}/profile/search-console?success=google_connected`;
      return res.redirect(cookieReturnUrl || defaultRedirect);
    }

    // ---------------------------------------------------------
    // FLOW B: LOGIN / REGISTER (New or Existing User)
    // ---------------------------------------------------------
    if (flow === 'login_flow') {
      // Get User Info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userResponse.json();

      if (!googleUser.email) {
        throw new Error('Google User Email not found');
      }

      // Find or Create User with Domains
      let user = await User.findOne({
        where: { email: googleUser.email },
        include: [{ model: Domain, as: 'domains' }] // Make sure to define alias if needed, usually 'domains' based on User model
      });

      if (!user) {
        // Register new user
        user = await User.create({
          email: googleUser.email,
          name: googleUser.name || 'Google User',
          password: '', // No password for Google users
          subscription_plan: 'free',
          is_active: true,
          scraper_type: 'scrapingrobot', // Default
          picture: googleUser.picture || null, // Create with picture
        });

        // Check for any pending workspace invitation addressed to this email.
        // If there is one, the user came here specifically to join that
        // workspace — we must NOT auto-create a personal workspace, otherwise
        // they will end up with two. The invitation acceptance page will take
        // care of attaching them to the invited workspace.
        const WorkspaceInvitation = (await import('../../../../database/models/workspace_invitation')).default;
        const pendingInvite = await WorkspaceInvitation.findOne({
          where: { email: googleUser.email, status: 'pending' }
        });
        if (!pendingInvite) {
          await ensurePersonalWorkspace(user.id, googleUser.name);
        }

        // Link referral if ref_code cookie exists
        try {
          const refCode = req.cookies?.ref_code;
          if (refCode && /^[A-Za-z0-9]{6,10}$/.test(refCode)) {
            const { createReferral } = await import('../../../../services/referralService');
            const referrer = await User.findOne({ where: { referral_code: refCode } });
            if (referrer && referrer.id !== user.id) {
              await createReferral(referrer.id, user.id);
            }
          }
        } catch (refErr) {
          console.error('[Google Callback] Referral linking failed:', refErr);
        }
      } else {
        // Existing user: only create a personal workspace if they have no memberships at all.
        const WorkspaceMember = (await import('../../../../database/models/workspace_member')).default;
        const anyMembership = await WorkspaceMember.findOne({
          where: { user_id: user.id, status: 'active' }
        });
        if (!anyMembership) {
          await ensurePersonalWorkspace(user.id);
        }
        // Update existing user with new picture if available
        if (googleUser.picture) {
          await user.update({ picture: googleUser.picture });
        }
      }

      // Login the user (Create JWT)
      if (process.env.SECRET) {
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            name: user.name,
          },
          process.env.SECRET,
          { expiresIn: '24h' }
        );

        const cookies = new Cookies(req, res);
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 24);
        cookies.set('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          expires: expireDate
        });

        await user.update({ last_login: new Date() });

        // Redirect based on returnUrl first, then onboarding step
        if (returnUrl) {
          const absoluteUrl = returnUrl.startsWith('http') ? returnUrl : `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}`;
          return res.redirect(absoluteUrl);
        }

        // ---------------------------------------------------------------
        // Post-login redirect logic
        // ---------------------------------------------------------------
        // Before anything, resolve the user's active workspace and its domains.
        // A team member may not own any domains themselves but inherits the
        // workspace's domains — so we must look at the workspace, NOT user.domains.
        const u = user as any;
        const onboardingStep = u.onboarding_step || 0;

        // Import workspace helpers lazily
        const WorkspaceMember = (await import('../../../../database/models/workspace_member')).default;
        const Workspace = (await import('../../../../database/models/workspace')).default;

        // Load the user's active workspace (current_workspace_id first, else first membership)
        let activeWorkspaceId: number | null = u.current_workspace_id || null;
        if (!activeWorkspaceId) {
          const firstMember: any = await WorkspaceMember.findOne({
            where: { user_id: user.id, status: 'active' }
          });
          activeWorkspaceId = firstMember?.workspace_id || null;
          if (activeWorkspaceId) {
            await user.update({ current_workspace_id: activeWorkspaceId } as any);
          }
        }

        // Load domains of the active workspace + figure out the caller's role
        let workspaceDomains: any[] = [];
        let roleInActive: string | null = null;
        if (activeWorkspaceId) {
          workspaceDomains = await Domain.findAll({
            where: { workspace_id: activeWorkspaceId },
            order: [['added', 'ASC']]
          });
          const member: any = await WorkspaceMember.findOne({
            where: { workspace_id: activeWorkspaceId, user_id: user.id, status: 'active' }
          });
          roleInActive = member?.role || null;
        }

        const isTeamMember = roleInActive && roleInActive !== 'owner';

        // Team members always skip onboarding — they inherit a configured workspace
        if (isTeamMember) {
          if (onboardingStep < 3) {
            await user.update({ onboarding_step: 3 } as any);
          }
          if (workspaceDomains.length > 0) {
            const firstDomain: any = workspaceDomains[0].get({ plain: true });
            return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/domain/insight/${firstDomain.slug}`);
          }
          // Team member of an empty workspace — land on profile page
          return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile`);
        }

        // Owners: run normal onboarding flow
        if (onboardingStep < 3) {
          if (workspaceDomains.length > 0) {
            await user.update({ onboarding_step: 3 } as any);
            const firstDomain: any = workspaceDomains[0].get({ plain: true });
            return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/domain/insight/${firstDomain.slug}`);
          }
          return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding`);
        }

        if (workspaceDomains.length > 0) {
          const firstDomain: any = workspaceDomains[0].get({ plain: true });
          return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/domain/insight/${firstDomain.slug}`);
        }

        return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding`);
      }
    }

    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=unknown_state`);

  } catch (err) {
    console.error('Callback Error:', err);
    return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=callback_failed`);
  }
}
