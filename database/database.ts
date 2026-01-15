import { Sequelize } from 'sequelize-typescript';
import Domain from './models/domain';
import Keyword from './models/keyword';
import User from './models/user';
import FailedJob from './models/failedJob';
import ChatMessage from './models/chatMessage';
import ChatSession from './models/chatSession';
import Post from './models/post';
import ApiKey from './models/apiKey';
import ApiAuditLog from './models/apiAuditLog';

// MySQL connection only (SQLite removed for performance and simplicity)
// Debugging DB Credentials
console.log('--- DB INITIALIZATION ---');
console.log('process.env.DB_PASSWORD Raw:', JSON.stringify(process.env.DB_PASSWORD));
console.log('Is empty string?', process.env.DB_PASSWORD === '');

const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
console.log('Resolved Password:', JSON.stringify(password));

const connection = new Sequelize({
   dialect: 'mysql',
   host: process.env.DB_HOST || 'localhost',
   username: process.env.DB_USER || 'root',
   password: password,
   database: process.env.DB_NAME || 'flowxtra_serp',
   port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 8889,
   pool: {
      max: 10,
      min: 0,
      idle: 10000,
      acquire: 30000,
   },
   logging: false,
   models: [User, Domain, Keyword, FailedJob, ChatMessage, ChatSession, Post, ApiKey, ApiAuditLog],
});

export default connection;
