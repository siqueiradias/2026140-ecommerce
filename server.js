/*
 * server.js
 * Main entry point of the Natura Essence e-commerce application.
 * It creates the Express server, adds security headers with Helmet
 * and serves the frontend files (HTML, CSS, JavaScript and images)
 * from the "public" folder.
 */

// Import the packages used by the server
const express = require("express"); // web framework for Node.js
const helmet = require("helmet");   // adds secure HTTP headers, including a Content Security Policy
const path = require("path");       // built-in Node.js module to build folder paths safely

// Create the Express application
const app = express();

// Port where the server listens: http://localhost:3000
const PORT = 3000;


// ---------- Middleware ----------

// Helmet sets security headers on every response.
// Its Content Security Policy (CSP) only allows scripts, styles and images
// from our own server. This helps prevent Cross-Site Scripting (XSS).
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

// Serve the static files stored in the "public" folder.
// index.html opens automatically when the user visits http://localhost:3000
app.use(express.static(path.join(__dirname, "public")));


// ---------- Start the server ----------

app.listen(PORT, function () {
    console.log("Server running at http://localhost:" + PORT);
});
