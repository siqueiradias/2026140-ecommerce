/*
 * products.js
 * Builds the shop page:
 * 1. Loads all products from the server (GET /api/products, which reads MySQL).
 * 2. Creates one card per product.
 * 3. Creates a filter button for each category, so the user can see
 *    only one category without reloading the page.
 */

// Elements of products.html that this script fills in
const productGrid = document.getElementById("productGrid");
const categoryFilters = document.getElementById("categoryFilters");
const productsStatus = document.getElementById("productsStatus");

// Full list of products received from the server (kept for the filter)
let allProducts = [];

// Formats a number as euros, e.g. 7.95 -> "€7.95" (Irish English format)
const priceFormat = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

// Start as soon as the page loads
loadProducts();

async function loadProducts() {
    try {
        const response = await fetch("/api/products");

        // response.ok is false for errors such as 500
        if (!response.ok) {
            throw new Error("Server answered with status " + response.status);
        }

        allProducts = await response.json();

        productsStatus.textContent = ""; // remove "Loading products..."
        createCategoryFilters(allProducts);
        showProducts(allProducts);
    } catch (error) {
        console.log("Could not load products:", error);
        productsStatus.textContent = "Sorry, we could not load the products. Please try again later.";
    }
}

// Create one product card for each product in the list.
// Elements are built with createElement and textContent (not innerHTML),
// so text coming from the database can never run as HTML (XSS protection).
function showProducts(products) {
    productGrid.textContent = ""; // remove the cards shown before

    products.forEach(function (product) {
        const card = document.createElement("article");
        card.className = "product-card";

        const image = document.createElement("img");
        image.src = "images/products/" + product.image;
        image.alt = product.name;
        image.width = 800;
        image.height = 800;
        image.loading = "lazy"; // only download the image when it is about to appear on screen

        const body = document.createElement("div");
        body.className = "product-body";

        const category = document.createElement("p");
        category.className = "product-category";
        category.textContent = product.category;

        const name = document.createElement("h2");
        name.className = "product-name";
        name.textContent = product.name;

        const size = document.createElement("p");
        size.className = "product-size";
        size.textContent = product.size;

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description;

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = priceFormat.format(product.price);

        body.append(category, name, size, description, price);
        card.append(image, body);
        productGrid.append(card);
    });
}

// Create the filter buttons: "All" plus one button per category.
// The categories come from the products themselves, so a new category
// added to the database appears here automatically.
function createCategoryFilters(products) {
    const categories = [];

    products.forEach(function (product) {
        if (!categories.includes(product.category)) {
            categories.push(product.category);
        }
    });

    // "All" is first and selected when the page opens
    addFilterButton("All", true);

    categories.forEach(function (category) {
        addFilterButton(category, false);
    });
}

function addFilterButton(category, selected) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category;
    // aria-pressed tells screen readers which filter is currently selected
    button.setAttribute("aria-pressed", selected ? "true" : "false");

    button.addEventListener("click", function () {
        // Mark only the clicked button as selected
        document.querySelectorAll(".filter-button").forEach(function (otherButton) {
            otherButton.setAttribute("aria-pressed", "false");
        });
        button.setAttribute("aria-pressed", "true");

        // Show every product, or only the products of the chosen category
        if (category === "All") {
            showProducts(allProducts);
        } else {
            const filtered = allProducts.filter(function (product) {
                return product.category === category;
            });
            showProducts(filtered);
        }
    });

    categoryFilters.append(button);
}
