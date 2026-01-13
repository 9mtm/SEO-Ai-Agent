import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Cookies from 'cookies';
import User from '../../database/models/user';
import connection from '../../database/database';

type loginResponse = {
   success?: boolean
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method === 'POST') {
      return loginUser(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const loginUser = async (req: NextApiRequest, res: NextApiResponse<loginResponse>) => {
   const { username, email, password } = req.body;
   const loginIdentifier = email || username; // Support both email and username

   if (!loginIdentifier || !password) {
      return res.status(401).json({ error: 'Email and password required' });
   }

   try {
      // Ensure database connection
      await connection.sync();

      // Try to login with database user (Multi-tenant mode)
      const user = await User.findOne({
         where: { email: loginIdentifier.toLowerCase(), is_active: true }
      });

      if (user) {
         // Verify password with bcrypt
         const isPasswordValid = await bcrypt.compare(password, user.password);

         if (isPasswordValid && process.env.SECRET) {
            // Create JWT token with user info
            const token = jwt.sign(
               {
                  userId: user.id,
                  email: user.email,
                  name: user.name,
               },
               process.env.SECRET,
               { expiresIn: '24h' }
            );

            // Set cookie
            const cookies = new Cookies(req, res);
            const expireDate = new Date();
            const sessDuration = process.env.SESSION_DURATION;
            expireDate.setHours(expireDate.getHours() + (sessDuration ? parseInt(sessDuration, 10) : 24));
            cookies.set('token', token, {
               httpOnly: true,
               sameSite: 'lax',
               expires: expireDate
            });

            // Update last login
            await user.update({ last_login: new Date() });

            return res.status(200).json({ success: true, error: null });
         }
      }

      // Fallback to legacy single-user mode (env variables)
      const legacyUserName = process.env.USER_NAME || process.env.USER;
      if (loginIdentifier === legacyUserName
         && password === process.env.PASSWORD
         && process.env.SECRET) {
         const token = jwt.sign({ user: legacyUserName, legacy: true }, process.env.SECRET);
         const cookies = new Cookies(req, res);
         const expireDate = new Date();
         const sessDuration = process.env.SESSION_DURATION;
         expireDate.setHours(expireDate.getHours() + (sessDuration ? parseInt(sessDuration, 10) : 24));
         cookies.set('token', token, { httpOnly: true, sameSite: 'lax', expires: expireDate });
         return res.status(200).json({ success: true, error: null });
      }

      return res.status(401).json({ success: false, error: 'Invalid email or password' });
   } catch (error) {
      console.error('[Login Error]:', error);
      return res.status(500).json({ success: false, error: 'An error occurred during login' });
   }
};
