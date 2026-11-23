/*
 * products.sql
 * Adds the 16 Natura Essence products to the "products" table.
 * Run it in MySQL Workbench AFTER schema.sql.
 * All products, descriptions and prices are fictional (academic project).
 * The image files are stored in public/images/products/.
 */

USE natura_essence;

-- Send the text as UTF-8 so characters such as "·" and "&" are stored correctly
SET NAMES utf8mb4;

-- Start from an empty table so the script can be run again without
-- creating duplicates, and restart the id numbers from 1.
-- "WHERE id > 0" is needed because MySQL Workbench runs in "safe update mode",
-- which blocks a DELETE without a WHERE on a key column (protection against
-- deleting a whole table by mistake).
-- (Run this only while there are no orders that refer to the products.)
DELETE FROM products WHERE id > 0;
ALTER TABLE products AUTO_INCREMENT = 1;

-- Insert all products in one statement.
-- The id and created_at columns are filled in automatically by MySQL.
INSERT INTO products (name, category, size, price, description, image) VALUES
    ('Calm Mind Herbal Tea', 'Teas', '50 g · Loose-leaf tea', 7.95,
     'A loose-leaf blend of chamomile, lemon balm and lavender with a delicate floral aroma. A gentle choice for a quiet tea break at any time of day.',
     '01_calm_mind_herbal_tea.jpg'),
    ('Turmeric Complex', 'Supplements', '60 capsules', 14.95,
     'A capsule blend featuring turmeric and black pepper in a convenient format. Its warm, earthy ingredients bring a familiar botanical character to the collection.',
     '02_turmeric_complex.jpg'),
    ('Echinacea Extract', 'Herbal Extracts', '50 ml · Liquid extract', 12.50,
     'A liquid botanical extract featuring echinacea, presented in a compact amber dropper bottle. A handy format for customers who prefer liquid herbal products.',
     '03_echinacea_extract.jpg'),
    ('Omega-3 from Algae', 'Supplements', '60 softgels', 18.90,
     'A plant-based omega-3 product sourced from algae and presented in easy-to-take softgels. A practical option for customers who prefer an algae-based supplement.',
     '04_omega3_from_algae.jpg'),
    ('Lavender Essential Oil', 'Oils', '10 ml · Essential oil', 9.90,
     'A concentrated essential oil with a fresh, floral lavender aroma. Ideal for use in a diffuser or as part of a home-fragrance collection.',
     '05_lavender_essential_oil.jpg'),
    ('Peppermint & Fennel Tea', 'Teas', '50 g · Loose-leaf tea', 7.90,
     'A refreshing herbal blend of aromatic peppermint leaves and naturally sweet fennel. It makes a light, fragrant infusion for everyday enjoyment.',
     '06_peppermint_fennel_tea.jpg'),
    ('Golden Spice Herbal Infusion', 'Teas', '60 g · Herbal infusion', 9.50,
     'A warming blend of turmeric, ginger and cinnamon, bringing rich aromas and naturally spicy flavours. Enjoy its golden colour and warming taste as a caffeine-free infusion.',
     '07_golden_spice_herbal_infusion.jpg'),
    ('Vitamin D3 Capsules', 'Supplements', '60 capsules', 11.90,
     'A vitamin D3 supplement presented in a simple capsule format. The compact bottle is easy to store alongside other everyday wellness products.',
     '08_vitamin_d3_2000iu.jpg'),
    ('Magnesium Complex', 'Supplements', '60 capsules', 13.90,
     'A capsule supplement combining magnesium with vitamin B6 in an easy-to-store format. A straightforward addition to a daily supplement collection.',
     '09_magnesium_complex.jpg'),
    ('Ashwagandha Capsules', 'Supplements', '60 capsules', 16.50,
     'A botanical supplement featuring ashwagandha root, presented in a convenient capsule format. A compact option for customers exploring traditional herbal ingredients.',
     '10_ashwagandha_capsules.jpg'),
    ('Tea Tree Essential Oil', 'Oils', '10 ml · Essential oil', 8.90,
     'A concentrated essential oil with a fresh, herbal aroma. Its versatile scent makes it a natural addition to home-fragrance and personal-care collections.',
     '11_tea_tree_essential_oil.jpg'),
    ('Calendula & Jojoba Body Oil', 'Body Care', '100 ml · Body oil', 16.90,
     'A lightweight botanical body oil combining jojoba oil with calendula extract. Its smooth texture makes it a pleasant addition to an everyday skincare routine.',
     '12_calendula_jojoba_body_oil.jpg'),
    ('Lavender & Oat Bath Soak', 'Bath & Body', '300 g · Bath soak', 12.00,
     'A bath blend featuring aromatic lavender and finely ground oats. Designed to add a gentle botanical touch to a relaxing bathing ritual.',
     '13_lavender_oat_bath_soak.jpg'),
    ('Shea Butter Body Balm', 'Body Care', '100 g · Body balm', 14.90,
     'A rich, plant-based balm featuring shea butter in a convenient jar. Its creamy texture is suited to a simple, everyday body-care routine.',
     '14_shea_butter_body_balm.jpg'),
    ('Herbal Room Mist', 'Home & Wellness', '100 ml · Room mist', 11.50,
     'A botanical-inspired room mist with lavender and lemon balm notes. A simple way to add a fresh, gentle scent to a living space.',
     '15_herbal_room_mist.jpg'),
    ('Probiotic Complex', 'Supplements', '30 capsules', 17.50,
     'A supplement blend featuring selected probiotic cultures in a convenient capsule format. The compact bottle fits neatly into a daily wellness product collection.',
     '16_probiotic_complex.jpg');


-- ---------- Check the result ----------
-- Should list 16 products
SELECT id, name, category, size, price, image FROM products;

-- Number of products in each category
SELECT category, COUNT(*) AS total FROM products GROUP BY category;
