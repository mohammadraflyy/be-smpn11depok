const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit || 10,
  queueLimit: 0
});

module.exports = pool;
