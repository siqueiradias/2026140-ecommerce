/*
 * schema.sql
 * Creates the Natura Essence database and its tables.
 * How to use: open MySQL Workbench, connect to the local server,
 * open this file (File > Open SQL Script) and run it (lightning icon).
 * It can be run more than once: "IF NOT EXISTS" avoids errors when
 * the database or tables already exist.
 */

-- ---------- Database ----------

-- utf8mb4 stores any character, including accents (e.g. "Café") and symbols such as €
CREATE DATABASE IF NOT EXISTS natura_essence
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Every statement below runs inside this database
USE natura_essence;


-- ---------- Table: users ----------
-- Stores the customers who register on the website.
-- Same structure as the registration/login exercise from class,
-- plus the date the account was created.
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,         -- unique number created automatically by MySQL
    name       VARCHAR(100) NOT NULL,                  -- customer's full name
    email      VARCHAR(255) NOT NULL UNIQUE,           -- UNIQUE: the same email cannot register twice
    password   VARCHAR(255) NOT NULL,                  -- "salt:hash", never the real password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP     -- filled in automatically when the row is inserted
);


-- ---------- Table: products ----------
-- Stores the products shown in the shop catalogue.
-- The website reads this table, so changing a price here
-- changes it on the website without editing any HTML.
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,        -- unique product number
    name        VARCHAR(100) NOT NULL,                 -- product name
    category    VARCHAR(50) NOT NULL,                  -- e.g. Teas, Oils, Supplements
    description TEXT NOT NULL,                         -- short text shown on the product card
    price       DECIMAL(10, 2) NOT NULL,               -- DECIMAL keeps exact cents (FLOAT could round 9.99 to 9.9899...)
    image       VARCHAR(255) NOT NULL,                 -- image file name inside public/images/products/
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price_positive CHECK (price > 0)    -- the database itself refuses a zero or negative price
);


-- ---------- Check the result ----------
-- Both tables are empty for now; the products are added in a later step.
SHOW TABLES;
DESCRIBE users;
DESCRIBE products;
