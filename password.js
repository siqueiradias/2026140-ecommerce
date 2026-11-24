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

// Check a password typed at login against the "salt:hash" saved in the database.
// The same salt is used to hash the typed password; if both hashes are equal,
// the password is correct.
function verifyPassword(password, storedValue) {
    const parts = storedValue.split(":");

    // Stored value not in the expected "salt:hash" format
    if (parts.length !== 2) {
        return false;
    }

    const salt = parts[0];
    const savedHash = Buffer.from(parts[1], "hex");
    const typedHash = Buffer.from(hashPassword(password, salt), "hex");

    // timingSafeEqual compares the hashes in constant time, so an attacker
    // cannot learn anything from how long the comparison takes
    return savedHash.length === typedHash.length && crypto.timingSafeEqual(savedHash, typedHash);
}

// Make the functions available to server.js
module.exports = { hashPassword, createPasswordHash, verifyPassword };
