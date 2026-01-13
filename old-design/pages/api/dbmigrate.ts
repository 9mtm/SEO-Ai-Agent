import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import type { NextApiRequest, NextApiResponse } from 'next';
import sequelize from '../../database/database';
import verifyUser from '../../utils/verifyUser';

type MigrationGetResponse = {
   pending?: any[],
   executed?: any[],
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   if (req.method === 'GET') {
      return getMigrationStatus(req, res);
   }
   if (req.method === 'POST') {
      return migrateDatabase(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getMigrationStatus = async (req: NextApiRequest, res: NextApiResponse<MigrationGetResponse>) => {
   const umzug = new Umzug({
      migrations: { glob: 'database/migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: undefined,
   });

   try {
      const pending = await umzug.pending();
      const executed = await umzug.executed();
      return res.status(200).json({ pending, executed });
   } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error checking migrations' });
   }
};

const migrateDatabase = async (req: NextApiRequest, res: NextApiResponse<MigrationGetResponse>) => {
   const umzug = new Umzug({
      migrations: { glob: 'database/migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
   });

   try {
      await umzug.up();
      const pending = await umzug.pending();
      const executed = await umzug.executed();
      return res.status(200).json({ pending, executed });
   } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error running migrations' });
   }
};
