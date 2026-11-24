/*
 * database.js
 * Creates the connection to the MySQL database and exports it,
 * so any server file can run queries with: db.query(...)
 * The login details come from the .env file, not from the code,
 * so the real password is not uploaded to GitHub.
 */

// mysql2 is the driver that lets Node.js talk to MySQL
const mysql = require("mysql2");

// A pool keeps a few connections open and uses them again.
// It works better than a single connection: if one connection drops,
// the pool opens a new one, and it can serve several users at the same time.
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
