import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../utils/verifyUser';
import FailedJob from '../../database/models/failedJob';

type SettingsGetResponse = {
   cleared?: boolean,
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   if (req.method === 'PUT') {
      return clearFailedQueue(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const clearFailedQueue = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>) => {
   try {
      await FailedJob.destroy({ truncate: true });
      return res.status(200).json({ cleared: true });
   } catch (error) {
      console.log('[ERROR] Clearing Failed Queue DB.', error);
      return res.status(200).json({ error: 'Error Clearing Failed Queue!' });
   }
};
