/*
 * server.js
 * Main file of the Natura Essence e-commerce app.
 * It starts the Express server and adds security headers with Helmet.
 * It sends the frontend files (HTML, CSS, JavaScript and images)
 * from the "public" folder and handles the requests that use the database.
 */

// Load the settings from the .env file (database password, port...)
// This must run first, before database.js reads process.env
require("dotenv").config({ quiet: true });

// Import the packages used by the server
const express = require("express"); // web framework for Node.js
const helmet = require("helmet");   // adds secure HTTP headers, including a Content Security Policy
const path = require("path");       // built-in Node.js module to build file and folder paths safely
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

// The session secret signs the session cookie, so nobody can make a fake one.
// If it is missing from .env, show a message and stop.
if (!process.env.SESSION_SECRET) {
    console.log("SESSION_SECRET is missing in the .env file (see .env.example)");
    process.exit(1);
}


// ---------- Middleware ----------

// Helmet adds security headers to every response.
// Its Content Security Policy (CSP) only allows scripts, styles and images
// from our own server. This helps to stop Cross-Site Scripting (XSS).
// "upgradeInsecureRequests" is turned off because the project runs on
// http://localhost (no HTTPS). Without this, browsers like Safari try to
// load the CSS and images over HTTPS and the page breaks.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            upgradeInsecureRequests: null
        }
    }
}));

// Read the JSON data sent by the browser with fetch() and put it in req.body
app.use(express.json());

// Sessions: after login, the user's details are kept on the server.
// The browser only gets a signed cookie with a random session id.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,                // do not save the session again if nothing changed
    saveUninitialized: false,     // only create a session (and cookie) after a successful login
    cookie: {
        httpOnly: true,           // JavaScript in the page cannot read the cookie (protects against XSS)
        sameSite: "lax",          // cookie is not sent with POST requests from other websites (protects against CSRF)
        maxAge: 2 * 60 * 60 * 1000 // session lasts 2 hours (value in milliseconds)
    }
}));

// Rate limit for the login route: max 5 failed attempts in 15 minutes
// from the same IP address. This stops "brute force" password guessing.
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
    // Select only the columns that the website needs
    const sql = "SELECT id, name, category, size, description, price, image FROM products ORDER BY id";

    db.query(sql, function (error, results) {
        if (error) {
            // Show the real error in the terminal and send a simple message to the user
            console.log("Error reading products:", error.message);
            return res.status(500).json({ message: "Could not load products" });
        }

        // results is an array of rows, e.g. [{ id: 1, name: "...", price: 9.99, ... }]
        res.json(results);
    });
});

// POST /api/register
// Creates a new customer account.
// register.js checks the same rules in the browser, but the server checks
// them again, because an attacker can skip the browser checks.
app.post("/api/register", function (req, res) {
    // Read the form fields. typeof checks that each value is text,
    // so other data (numbers, objects...) cannot crash the server.
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

    // The ? placeholders keep the user's input separate from the SQL command.
    // This protects the database against SQL injection.
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, hashedPassword], function (error, result) {
        if (error) {
            // The email column is UNIQUE, so MySQL does not accept the same email twice.
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
// Checks the email and password. If they are correct, it starts a session.
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

    // Find the user with this email (the ? placeholder protects against SQL injection)
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

        // Create a new session id at login. This stops "session fixation" attacks,
        // where an attacker makes the victim use a session id the attacker already knows.
        req.session.regenerate(function (sessionError) {
            if (sessionError) {
                console.log("Error creating session:", sessionError.message);
                return res.status(500).json({ message: "Something went wrong. Please try again later." });
            }

            // Store only what the website needs. Never put the password hash in the session.
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
// Tells the browser if someone is logged in, so the menu can show
// "Login" or "Logout". Only the name is sent, never the password.
app.get("/api/session", function (req, res) {
    if (req.session.user) {
        return res.json({ loggedIn: true, name: req.session.user.name });
    }

    res.json({ loggedIn: false });
});

// POST /api/orders
// Simulated checkout: saves a new order for the logged-in customer.
// The browser sends only product ids and quantities, e.g. { items: [{ id: 1, quantity: 2 }] }.
// The server calculates the total with the prices from the database,
// so changing a price in the browser cannot change what the customer pays.
app.post("/api/orders", function (req, res) {
    // Only logged-in customers can place an order (status 401 = not logged in)
    if (!req.session.user) {
        return res.status(401).json({ message: "Please log in to complete your order." });
    }

    const items = req.body.items;
    const invalidMessage = "Your basket contains invalid items. Please review your basket.";

    // The basket must be a non-empty list
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: invalidMessage });
    }

    // Each line needs an integer id and a quantity of at least 1
    const validItems = items.every(function (item) {
        return item !== null && Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity >= 1;
    });

    if (!validItems) {
        return res.status(400).json({ message: invalidMessage });
    }

    // Each product can appear only once (the basket adds up quantities instead).
    // A Set keeps only unique values, so a smaller Set means a repeated id.
    // The order_items primary key (order_id, product_id) would also refuse it,
    // but checking here gives the customer a clear 400 message instead of a 500 error.
    const uniqueIds = new Set(items.map(function (item) {
        return item.id;
    }));

    if (uniqueIds.size !== items.length) {
        return res.status(400).json({ message: invalidMessage });
    }

    // Read the real prices of the products in the basket.
    // mysql2 turns the list of ids into "IN (1, 5, 14)".
    const ids = items.map(function (item) {
        return item.id;
    });
    const sql = "SELECT id, price FROM products WHERE id IN (?)";

    db.query(sql, [ids], function (error, products) {
        if (error) {
            console.log("Error reading prices:", error.message);
            return res.status(500).json({ message: "Something went wrong. Please try again later." });
        }

        // Add up price * quantity for each line, and keep each line's
        // database price to save it in the order_items table
        let total = 0;
        const lines = [];

        for (const item of items) {
            const product = products.find(function (p) {
                return p.id === item.id;
            });

            // The product id does not exist in the database
            if (!product) {
                return res.status(400).json({ message: invalidMessage });
            }

            total = total + product.price * item.quantity;
            lines.push({ productId: product.id, quantity: item.quantity, price: product.price });
        }

        // Round to 2 decimal places (cents) to avoid results such as 40.699999
        total = Math.round(total * 100) / 100;

        // The order is saved with two INSERTs (orders, then order_items).
        // A transaction makes them work as one: if the second INSERT fails,
        // the first one is undone (rollback), so an order is never saved
        // without its products. A transaction needs one fixed connection,
        // so we take one connection from the pool.
        db.getConnection(function (connectionError, connection) {
            if (connectionError) {
                console.log("Error getting a connection:", connectionError.message);
                return res.status(500).json({ message: "Something went wrong. Please try again later." });
            }

            // Undo everything, give the connection back to the pool and answer with an error
            function cancelOrder(error) {
                console.log("Error saving order:", error.message);
                connection.rollback(function () {
                    connection.release();
                    res.status(500).json({ message: "Something went wrong. Please try again later." });
                });
            }

            connection.beginTransaction(function (transactionError) {
                if (transactionError) {
                    return cancelOrder(transactionError);
                }

                // 1. Save the order. AUTO_INCREMENT creates the new order number (id).
                const orderSql = "INSERT INTO orders (user_id, total) VALUES (?, ?)";

                connection.query(orderSql, [req.session.user.id, total], function (orderError, orderResult) {
                    if (orderError) {
                        return cancelOrder(orderError);
                    }

                    const orderId = orderResult.insertId;

                    // 2. Save one row per product: [order_id, product_id, quantity, unit_price].
                    // "VALUES ?" with a list of rows inserts all of them in one query.
                    const itemRows = lines.map(function (line) {
                        return [orderId, line.productId, line.quantity, line.price];
                    });
                    const itemsSql = "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?";

                    connection.query(itemsSql, [itemRows], function (itemsError) {
                        if (itemsError) {
                            return cancelOrder(itemsError);
                        }

                        // 3. Both INSERTs worked: make them permanent (commit)
                        connection.commit(function (commitError) {
                            if (commitError) {
                                return cancelOrder(commitError);
                            }

                            connection.release(); // give the connection back to the pool

                            const firstName = req.session.user.name.split(" ")[0];

                            // Status 201 (Created): the order was saved; orderId is its number
                            res.status(201).json({
                                message: "Thank you, " + firstName + "! Your order #" + orderId + " has been placed.",
                                orderId: orderId,
                                total: total
                            });
                        });
                    });
                });
            });
        });
    });
});


// ---------- Error handling ----------
// These handlers are placed after all the routes, so they only run when
// no route above answered the request or when something went wrong.

// Unknown API address (e.g. /api/xyz): answer in JSON, like the other API routes
app.use("/api", function (req, res) {
    res.status(404).json({ message: "The requested resource was not found." });
});

// Any other unknown address: show the 404 page with the status 404
app.use(function (req, res) {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

// Error handler. Express knows it is an error handler because it has 4 parameters.
// It runs when something fails, e.g. when the browser sends broken JSON.
// The user gets a simple message; the real error is shown only in the terminal.
app.use(function (error, req, res, next) {
    // Errors with a 4xx status come from bad data sent by the browser
    // (e.g. broken JSON or a request that is too big)
    if (error.status >= 400 && error.status < 500) {
        return res.status(error.status).json({ message: "Invalid request data." });
    }

    console.log("Unexpected error:", error.message);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
});


// ---------- Start the server ----------

// Test the database connection first and start the server only if it works.
// This way, a wrong password or a stopped MySQL shows a clear message in the terminal.
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
