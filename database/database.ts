import { Sequelize } from 'sequelize-typescript';
import * as mysql2 from 'mysql2';
import Domain from './models/domain';
import Keyword from './models/keyword';
import User from './models/user';
import FailedJob from './models/failedJob';
import Post from './models/post';
import ApiKey from './models/apiKey';
import ApiAuditLog from './models/apiAuditLog';
import NotificationSetting from './models/notificationSetting';
import PlatformIntegration from './models/platformIntegration';
import PlatformIntegrationLog from './models/platformIntegrationLog';
import InvoiceDetail from './models/invoiceDetail';
import Workspace from './models/workspace';
import WorkspaceMember from './models/workspace_member';
import WorkspaceInvitation from './models/workspace_invitation';
import BlogPost from './models/blogPost';
import Invoice from './models/invoice';
import Referral from './models/referral';
import ReferralPayout from './models/referralPayout';
import BlogPostTranslation from './models/blogPostTranslation';

// MySQL connection only (SQLite removed for performance and simplicity)
// Debugging DB Credentials
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';

const connection = new Sequelize({
   dialect: 'mysql',
   dialectModule: mysql2,
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
   dialectOptions: (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud')) ? {
      ssl: {
         require: true,
         rejectUnauthorized: false
      }
   } : {},
   logging: false,
   models: [User, Domain, Keyword, FailedJob, Post, ApiKey, ApiAuditLog, NotificationSetting, PlatformIntegration, PlatformIntegrationLog, InvoiceDetail, Workspace, WorkspaceMember, WorkspaceInvitation, BlogPost, BlogPostTranslation, Invoice, Referral, ReferralPayout],
});

export default connection;
