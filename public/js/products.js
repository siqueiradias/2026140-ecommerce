/*
 * products.js
 * Builds the shop page:
 * 1. Loads all products from the server (GET /api/products, which reads MySQL).
 * 2. Creates one card per product, with an "Add to Basket" button.
 * 3. Creates a filter button for each category, so the user can see
 *    only one category without reloading the page.
 */

// Elements of products.html that this script fills in
const productGrid = document.getElementById("productGrid");
const categoryFilters = document.getElementById("categoryFilters");
const productsStatus = document.getElementById("productsStatus");

// All the products from the server (kept for the filter)
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
// We use createElement and textContent (not innerHTML),
// so text from the database can never run as HTML (XSS protection).
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
        image.loading = "lazy"; // load the image only when the user scrolls near it

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

        // "Add to Basket" button: saves the product id in the basket (basket-storage.js)
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn primary add-button";
        button.textContent = "Add to Basket";
        button.addEventListener("click", function () {
            addToBasket(product.id);
            updateBasketLink(); // refresh "Basket (n)" in the menu

            // Short confirmation on the button, then back to the normal text
            button.textContent = "Added to basket ✓";
            button.classList.add("added");
            setTimeout(function () {
                button.textContent = "Add to Basket";
                button.classList.remove("added");
            }, 1500);
        });

        body.append(category, name, size, description, price, button);
        card.append(image, body);
        productGrid.append(card);
    });
}

// Create the filter buttons: "All" plus one button per category.
// The categories come from the products, so a new category
// in the database shows here automatically.
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
    // aria-pressed tells screen readers which filter is selected
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
