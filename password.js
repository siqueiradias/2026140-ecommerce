/*
 * password.js
 * Functions to protect user passwords, based on the registration/login
 * exercise from class. Passwords are never stored as plain text:
 * a random "salt" is created for each user and the password is hashed
 * with scrypt, a slow hashing algorithm built into Node.js (crypto module).
 */

// crypto is built into Node.js, so no extra npm package is needed
const crypto = require("crypto");

// Hash a password with a given salt.
// scrypt is deliberately slow, which makes guessing passwords much harder.
// The result is 64 bytes, converted to hexadecimal text.
function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

// Create the value saved in the "password" column of the users table.
// Format: "salt:hash". A new random salt for each user means two users with
// the same password still get completely different hashes.
function createPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    return salt + ":" + hashPassword(password, salt);
}

// Make the functions available to server.js
module.exports = { hashPassword, createPasswordHash };
