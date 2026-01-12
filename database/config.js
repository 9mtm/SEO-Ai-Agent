const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const config = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'flowxtra_serp',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 8889,
  dialect: 'mysql',
  dialectOptions: {
    bigNumberStrings: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
};

module.exports = {
  development: config,
  production: config,
};
