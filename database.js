/*
 * database.js
 * Creates the connection to the MySQL database and exports it,
 * so any file of the server can run queries with: db.query(...)
 * The login details come from the .env file (never written in the code),
 * so the real password is not uploaded to GitHub.
 */

// mysql2 is the driver that lets Node.js talk to MySQL
const mysql = require("mysql2");

// A pool keeps a few connections open and reuses them.
// It is more reliable than a single connection: if one connection drops,
// the pool simply opens a new one, and several users can be served at the same time.
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,   // maximum number of connections open at the same time
    decimalNumbers: true   // return DECIMAL columns (e.g. price) as numbers instead of text
});

// Export the pool so server.js (and other files) can use it
module.exports = db;
