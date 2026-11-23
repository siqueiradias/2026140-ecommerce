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

// Import the password hashing function created in password.js
const { createPasswordHash } = require("./password");

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

// Read JSON data sent by the browser with fetch() and place it in req.body
app.use(express.json());

// Serve the static files stored in the "public" folder.
// index.html opens automatically when the user visits http://localhost:3000
app.use(express.static(path.join(__dirname, "public")));


// ---------- Routes (API) ----------

// GET /api/products
// Reads every product from the database and sends the list to the browser as JSON.
app.get("/api/products", function (req, res) {
    // Only the columns the website needs are selected
    const sql = "SELECT id, name, category, size, description, price, image FROM products ORDER BY id";

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

// POST /api/register
// Creates a new customer account.
// The same rules are checked in the browser (register.js), but the server
// checks them again because browser checks can be skipped by a malicious user.
app.post("/api/register", function (req, res) {
    // Read the form fields. typeof checks that each value really is text,
    // so unexpected data (numbers, objects...) cannot crash the server.
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    // Validation: status 400 means the data sent is not valid
    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ message: "Please enter your full name (at least 2 characters)." });
    }

    // Simple email pattern: text@text.text with no spaces
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) {
        return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // Password: at least 8 characters, with at least one letter and one number
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters and include a letter and a number." });
    }

    // Never store the real password: save "salt:hash" instead
    const hashedPassword = createPasswordHash(password);

    // The ? placeholders keep the user's input separate from the SQL command,
    // which protects the database against SQL injection
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, hashedPassword], function (error, result) {
        if (error) {
            // The email column is UNIQUE, so MySQL refuses a repeated email.
            // Status 409 (Conflict) tells the browser the account already exists.
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "This email is already registered. Please log in instead." });
            }

            console.log("Error registering user:", error.message);
            return res.status(500).json({ message: "Something went wrong. Please try again later." });
        }

        // Status 201 (Created): the new user row was inserted
        res.status(201).json({ message: "Account created successfully! You can now log in." });
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
