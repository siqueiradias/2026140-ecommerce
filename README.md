# Natura Essence - E-Commerce Web Application

CA2 - Web Development, CCT College Dublin
Diogo Siqueira Dias - 2026140

Full-stack e-commerce website for natural wellness products. Users can register, log in, browse products loaded from a MySQL database, add or remove items in a shopping basket and complete a simulated checkout.

Built with HTML, CSS, JavaScript, Node.js, Express and MySQL.

## How to run

Requirements: Node.js (LTS) and MySQL 8.

1. Install the packages:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your MySQL password and a session secret. You can create a secret with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. In MySQL Workbench, run `database/schema.sql` and then `database/products.sql`.
4. Start the server:
   ```bash
   npm start
   ```
5. Open http://localhost:3000

## References

CCT College Dublin (2026) *User Registration & Login* [Class handbook]. Web Development module. Dublin: CCT College Dublin.

OpenAI (2026) *ChatGPT* [Large language model]. Used to generate the brand text (slogan, homepage text, product names and descriptions), the logo, the homepage banner and the product images. Available at: https://chatgpt.com/ (Accessed: 22 November 2026).

All products, prices and brand details are fictional and were created for this academic project.
