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
const session = require("express-session");     // remembers the logged-in user between pages
const rateLimit = require("express-rate-limit"); // limits repeated login attempts

// Import the MySQL connection pool created in database.js
const db = require("./database");

// Import the password functions created in password.js
const { createPasswordHash, verifyPassword } = require("./password");

// Create the Express application
const app = express();

// Port where the server listens, taken from .env (3000 if it is missing)
const PORT = process.env.PORT || 3000;

// The session secret signs the session cookie so it cannot be forged.
// Stop with a clear message if it is missing from .env.
if (!process.env.SESSION_SECRET) {
    console.log("SESSION_SECRET is missing in the .env file (see .env.example)");
    process.exit(1);
}


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

// Sessions: after login the server stores the user's details on the server side
// and gives the browser only a signed cookie with a random session id.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,                // do not save the session again if nothing changed
    saveUninitialized: false,     // only create a session (and cookie) after a successful login
    cookie: {
        httpOnly: true,           // JavaScript in the page cannot read the cookie (protects against XSS)
        sameSite: "lax",          // cookie is not sent by forms on other websites (protects against CSRF)
        maxAge: 2 * 60 * 60 * 1000 // session lasts 2 hours (value in milliseconds)
    }
}));

// Rate limit for the login route: at most 5 failed attempts every 15 minutes
// from the same IP address, which stops "brute force" password guessing.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,     // 15 minutes
    limit: 5,                     // maximum attempts in that time
    skipSuccessfulRequests: true, // a correct login does not count as an attempt
    standardHeaders: "draft-8",   // tell the browser how long to wait (RateLimit header)
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again in 15 minutes." }
});

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

// POST /api/login
// Checks the email and password and, if they are correct, starts a session.
// loginLimiter runs first and blocks the request after too many failed attempts.
app.post("/api/login", loginLimiter, function (req, res) {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password === "") {
        return res.status(400).json({ message: "Please enter your password." });
    }

    // Look for the user with this email (? placeholder protects against SQL injection)
    const sql = "SELECT id, name, email, password FROM users WHERE email = ?";

    db.query(sql, [email], function (error, results) {
        if (error) {
            console.log("Error during login:", error.message);
            return res.status(500).json({ message: "Something went wrong. Please try again later." });
        }

        // The same message is used for "email not found" and "wrong password",
        // so an attacker cannot find out which emails are registered.
        // Status 401 means the login details are not valid.
        if (results.length === 0 || !verifyPassword(password, results[0].password)) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = results[0];

        // Create a brand-new session id at login (prevents "session fixation" attacks,
        // where an attacker tries to make the victim use a session id they already know)
        req.session.regenerate(function (sessionError) {
            if (sessionError) {
                console.log("Error creating session:", sessionError.message);
                return res.status(500).json({ message: "Something went wrong. Please try again later." });
            }

            // Store only what the website needs; the password hash is never stored in the session
            req.session.user = { id: user.id, name: user.name, email: user.email };

            // Use only the first name in the welcome message
            const firstName = user.name.split(" ")[0];
            res.json({ message: "Welcome back, " + firstName + "!" });
        });
    });
});

// POST /api/logout
// Ends the session on the server and removes the session cookie from the browser.
app.post("/api/logout", function (req, res) {
    req.session.destroy(function (error) {
        if (error) {
            console.log("Error during logout:", error.message);
            return res.status(500).json({ message: "Something went wrong. Please try again later." });
        }

        res.clearCookie("connect.sid"); // default name of the express-session cookie
        res.json({ message: "Logged out" });
    });
});

// GET /api/session
// Tells the browser whether someone is logged in, so the menu can show
// "Login" or "Logout". Only the name is sent, never the password.
app.get("/api/session", function (req, res) {
    if (req.session.user) {
        return res.json({ loggedIn: true, name: req.session.user.name });
    }

    res.json({ loggedIn: false });
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
