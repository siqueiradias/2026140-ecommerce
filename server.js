/*
 * server.js
 * Main entry point of the Natura Essence e-commerce application.
 * It creates the Express server, adds security headers with Helmet,
 * serves the frontend files (HTML, CSS, JavaScript and images)
 * from the "public" folder and answers the requests that need the database.
 */

// Load the variables from the .env file (database password, port...)
// This must run first, before database.js reads process.env
require("dotenv").config({ quiet: true });

// Import the packages used by the server
const express = require("express"); // web framework for Node.js
const helmet = require("helmet");   // adds secure HTTP headers, including a Content Security Policy
const path = require("path");       // built-in Node.js module to build folder paths safely

// Import the MySQL connection pool created in database.js
const db = require("./database");

// Create the Express application
const app = express();

// Port where the server listens, taken from .env (3000 if it is missing)
const PORT = process.env.PORT || 3000;


// ---------- Middleware ----------

// Helmet sets security headers on every response.
// Its Content Security Policy (CSP) only allows scripts, styles and images
// that come from our own server, which helps prevent Cross-Site Scripting (XSS).
// "upgradeInsecureRequests" is turned off because the project runs on
// http://localhost (no HTTPS); otherwise browsers such as Safari would try to
// load the CSS and images over HTTPS and the page would break.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            upgradeInsecureRequests: null
        }
    }
}));

// Serve the static files stored in the "public" folder.
// index.html opens automatically when the user visits http://localhost:3000
app.use(express.static(path.join(__dirname, "public")));


// ---------- Routes (API) ----------

// GET /api/products
// Reads every product from the database and sends the list to the browser as JSON.
app.get("/api/products", function (req, res) {
    // Only the columns the website needs are selected
    const sql = "SELECT id, name, category, description, price, image FROM products ORDER BY id";

    db.query(sql, function (error, results) {
        if (error) {
            // Log the real error for the developer, send a simple message to the user
            console.log("Error reading products:", error.message);
            return res.status(500).json({ message: "Could not load products" });
        }

        // results is an array of rows, e.g. [{ id: 1, name: "...", price: 9.99, ... }]
        res.json(results);
    });
});


// ---------- Start the server ----------

// Check the database connection first and only start the server if it works,
// so a wrong password or a stopped MySQL is reported clearly in the terminal.
db.getConnection(function (error, connection) {
    if (error) {
        console.log("Database connection failed:", error.message);
        return;
    }

    console.log("MySQL connected successfully");
    connection.release(); // give the test connection back to the pool

    app.listen(PORT, function () {
        console.log("Server running at http://localhost:" + PORT);
    });
});
