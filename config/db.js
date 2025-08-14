require('dotenv').config();
const mysql = require('mysql2/promise');

const env = process.env.NODE_ENV || 'development';

const dbConfig = {
  development: {
    host: process.env.DEV_DB_HOST,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DEV_DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0
  },
  production: {
    host: process.env.PROD_DB_HOST,
    user: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.PROD_DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0
  }
};

const pool = mysql.createPool(dbConfig[env]);

module.exports = pool;
