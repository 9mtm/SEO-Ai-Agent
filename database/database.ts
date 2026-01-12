import { Sequelize } from 'sequelize-typescript';
import Domain from './models/domain';
import Keyword from './models/keyword';
import User from './models/user';
import Setting from './models/setting';
import FailedJob from './models/failedJob';
import ChatMessage from './models/chatMessage';
import ChatSession from './models/chatSession';

// MySQL connection only (SQLite removed for performance and simplicity)
const connection = new Sequelize({
   dialect: 'mysql',
   host: process.env.DB_HOST || 'localhost',
   username: process.env.DB_USER || 'root',
   password: process.env.DB_PASSWORD || 'root',
   database: process.env.DB_NAME || 'flowxtra_serp',
   port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 8889,
   pool: {
      max: 10,
      min: 0,
      idle: 10000,
      acquire: 30000,
   },
   logging: false,
   models: [User, Domain, Keyword, Setting, FailedJob, ChatMessage, ChatSession],
});

export default connection;
