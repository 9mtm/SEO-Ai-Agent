import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId?: number;
  email?: string;
  name?: string;
  user?: string; // Legacy single-user mode
  legacy?: boolean;
}

interface VerifyUserResult {
  authorized: boolean;
  userId?: number;
  user?: DecodedToken;
  isLegacy?: boolean;
}

/**
 * Enhanced Middleware: Verifies the user by their cookie value or their API Key
 * Supports both multi-tenant mode (userId) and legacy single-user mode
 * @param {NextApiRequest} req - The Next Request
 * @param {NextApiResponse} res - The Next Response.
 * @returns {VerifyUserResult}
 */
const verifyUser = (req: NextApiRequest, res: NextApiResponse): VerifyUserResult => {
   const cookies = new Cookies(req, res);
   const token = cookies && cookies.get('token');

   const allowedApiRoutes = [
      'GET:/api/keyword',
      'GET:/api/keywords',
      'GET:/api/domains',
      'POST:/api/refresh',
      'POST:/api/cron',
      'POST:/api/notify',
      'POST:/api/searchconsole',
      'GET:/api/searchconsole',
      'GET:/api/insight',
   ];

   const verifiedAPI = req.headers.authorization
      ? req.headers.authorization.substring('Bearer '.length) === process.env.APIKEY
      : false;

   const accessingAllowedRoute = req.url && req.method
      && allowedApiRoutes.includes(`${req.method}:${req.url.replace(/\?(.*)/, '')}`);

   // API Key authentication (for CRON jobs and external access)
   if (verifiedAPI && accessingAllowedRoute) {
      return { authorized: true };
   }

   // JWT Token authentication
   if (token && process.env.SECRET) {
      try {
         const decoded = jwt.verify(token, process.env.SECRET) as DecodedToken;

         // Multi-tenant mode (new system)
         if (decoded.userId) {
            return {
               authorized: true,
               userId: decoded.userId,
               user: decoded,
               isLegacy: false,
            };
         }

         // Legacy single-user mode
         if (decoded.user || decoded.legacy) {
            return {
               authorized: true,
               isLegacy: true,
               user: decoded,
            };
         }

         return { authorized: false };
      } catch (error) {
         console.error('[VerifyUser] Token verification failed:', error);
         return { authorized: false };
      }
   }

   return { authorized: false };
};

/**
 * Legacy compatibility wrapper - returns string for backward compatibility
 */
export const verifyUserLegacy = (req: NextApiRequest, res: NextApiResponse): string => {
   const result = verifyUser(req, res);
   return result.authorized ? 'authorized' : 'Not authorized';
};

export default verifyUser;
