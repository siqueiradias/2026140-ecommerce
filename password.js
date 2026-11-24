/*
 * password.js
 * Functions to protect user passwords, based on the registration/login
 * exercise from class. Passwords are never saved as plain text.
 * Each user gets a random "salt", and the password is hashed with scrypt,
 * a slow hashing algorithm built into Node.js (crypto module).
 */

// crypto is built into Node.js, so no extra npm package is needed
const crypto = require("crypto");

// Hash a password with a given salt.
// scrypt is slow on purpose, so guessing passwords is much harder.
// The result is 64 bytes, converted to hexadecimal text.
function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

// Create the value saved in the "password" column of the users table.
// Format: "salt:hash". Each user gets a new random salt, so two users with
// the same password still get different hashes.
function createPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    return salt + ":" + hashPassword(password, salt);
}

// Compare the password typed at login with the "salt:hash" saved in the database.
// Hash the typed password with the same salt. If both hashes are equal,
// the password is correct.
function verifyPassword(password, storedValue) {
    const parts = storedValue.split(":");

    // The saved value is not in the "salt:hash" format
    if (parts.length !== 2) {
        return false;
    }

    const salt = parts[0];
    const savedHash = Buffer.from(parts[1], "hex");
    const typedHash = Buffer.from(hashPassword(password, salt), "hex");

    // timingSafeEqual compares the hashes in constant time (always the same time),
    // so an attacker cannot learn anything from how long it takes
    return savedHash.length === typedHash.length && crypto.timingSafeEqual(savedHash, typedHash);
}

// Export the functions so server.js can use them
module.exports = { hashPassword, createPasswordHash, verifyPassword };
