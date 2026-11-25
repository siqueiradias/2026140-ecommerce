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
    size        VARCHAR(50) NOT NULL,                  -- pack size and format, e.g. "50 g · Loose-leaf tea"
    description TEXT NOT NULL,                         -- short text shown on the product card
    price       DECIMAL(10, 2) NOT NULL,               -- DECIMAL keeps exact cents (FLOAT could round 9.99 to 9.9899...)
    image       VARCHAR(255) NOT NULL,                 -- image file name inside public/images/products/
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price_positive CHECK (price > 0)    -- the database itself refuses a zero or negative price
);


-- ---------- Table: orders ----------
-- Stores every order placed at checkout: who placed it, the total and when.
-- The order number shown to the customer is the id created by AUTO_INCREMENT.
CREATE TABLE IF NOT EXISTS orders (
    id         INT AUTO_INCREMENT PRIMARY KEY,         -- order number
    user_id    INT NOT NULL,                           -- customer who placed the order
    total      DECIMAL(10, 2) NOT NULL,                -- total calculated by the server from database prices
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- date and time of the order
    -- Foreign key: user_id must match an existing id in the users table,
    -- so an order can never belong to a customer that does not exist
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_order_total_positive CHECK (total > 0)
);


-- ---------- Table: order_items ----------
-- Stores the products of each order: one row per product, with the quantity
-- and the price paid. Together with "orders" it shows exactly what was bought.
CREATE TABLE IF NOT EXISTS order_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    order_id   INT NOT NULL,                           -- order this line belongs to
    product_id INT NOT NULL,                           -- product that was bought
    quantity   INT NOT NULL,                           -- number of units
    unit_price DECIMAL(10, 2) NOT NULL,                -- price at the moment of purchase
                                                       -- (the product price can change later)
    -- Foreign keys: the order and the product must exist
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_item_quantity CHECK (quantity >= 1)
);


-- ---------- Check the result ----------
-- The tables start empty; the products are added by running products.sql.
SHOW TABLES;
DESCRIBE users;
DESCRIBE products;
DESCRIBE orders;
DESCRIBE order_items;
