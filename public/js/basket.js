/*
 * basket.js
 * Builds the basket page:
 * 1. Reads the basket saved in the browser (ids and quantities).
 * 2. Loads the current product details from the server (GET /api/products).
 * 3. Shows one row per product with "−" / "+" buttons, "Remove" and the
 *    line total, plus the order summary (number of items and total price).
 */

// Elements of basket.html that this script fills in
const basketItems = document.getElementById("basketItems");
const basketContent = document.getElementById("basketContent");
const basketEmpty = document.getElementById("basketEmpty");
const basketStatus = document.getElementById("basketStatus");

// Product details from the database, used to show names and prices
let productList = [];

// Formats a number as euros, e.g. 7.95 -> "€7.95"
const priceFormat = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

loadBasket();

async function loadBasket() {
    // If the basket is empty, there is no need to call the server
    if (getBasket().length === 0) {
        showBasket();
        return;
    }

    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Server answered with status " + response.status);
        }

        productList = await response.json();
        showBasket();
    } catch (error) {
        console.log("Could not load products:", error);
        basketStatus.textContent = "Sorry, we could not load the products. Please try again later.";
    }
}

// Draw the whole basket again. This runs when the page opens and after every change.
function showBasket() {
    // Match each basket line with its product details from the database.
    const lines = [];

    getBasket().forEach(function (item) {
        const product = productList.find(function (p) {
            return p.id === item.id;
        });

        if (product) {
            lines.push({ product: product, quantity: item.quantity });
        }
    });

    // Save the basket again without the products that are no longer in
    // the database, so "Basket (n)" does not count them
    saveBasket(lines.map(function (line) {
        return { id: line.product.id, quantity: line.quantity };
    }));

    updateBasketLink(); // keep "Basket (n)" in the menu up to date

    // Empty basket: show the message and the "Continue Shopping" button
    if (lines.length === 0) {
        basketContent.hidden = true;
        basketEmpty.hidden = false;
        return;
    }

    basketEmpty.hidden = true;
    basketContent.hidden = false;
    basketItems.textContent = ""; // remove the rows shown before

    let totalItems = 0;
    let totalPrice = 0;

    lines.forEach(function (line) {
        const lineTotal = line.product.price * line.quantity;
        totalItems = totalItems + line.quantity;
        totalPrice = totalPrice + lineTotal;

        basketItems.append(createRow(line.product, line.quantity, lineTotal));
    });

    document.getElementById("summaryItems").textContent = totalItems;
    document.getElementById("summaryTotal").textContent = priceFormat.format(totalPrice);
}

// Create one table row. We use createElement and textContent
// (not innerHTML) to protect against XSS.
// The CSS uses data-label to show the column name on mobile screens.
function createRow(product, quantity, lineTotal) {
    const row = document.createElement("tr");

    // Product: image, name and size
    const productCell = document.createElement("td");
    productCell.className = "basket-product";
    productCell.dataset.label = "Product";

    const image = document.createElement("img");
    image.src = "images/products/" + product.image;
    image.alt = "";            // decorative: the product name is shown next to it
    image.width = 72;
    image.height = 72;

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;
    const size = document.createElement("span");
    size.className = "basket-size";
    size.textContent = product.size;
    info.append(name, size);
    productCell.append(image, info);

    // Unit price
    const priceCell = document.createElement("td");
    priceCell.dataset.label = "Price";
    priceCell.textContent = priceFormat.format(product.price);

    // Quantity with "−" and "+" buttons
    const quantityCell = document.createElement("td");
    quantityCell.dataset.label = "Quantity";

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.textContent = "−";
    minusButton.setAttribute("aria-label", "Decrease quantity of " + product.name);
    minusButton.disabled = quantity <= 1;   // the minimum quantity is 1
    minusButton.addEventListener("click", function () {
        setBasketQuantity(product.id, quantity - 1);
        showBasket();
    });

    const quantityText = document.createElement("span");
    quantityText.className = "quantity-value";
    quantityText.textContent = quantity;

    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", "Increase quantity of " + product.name);
    plusButton.addEventListener("click", function () {
        setBasketQuantity(product.id, quantity + 1);
        showBasket();
    });

    controls.append(minusButton, quantityText, plusButton);
    quantityCell.append(controls);

    // Line total (price × quantity)
    const totalCell = document.createElement("td");
    totalCell.dataset.label = "Total";
    totalCell.className = "basket-line-total";
    totalCell.textContent = priceFormat.format(lineTotal);

    // Remove button
    const removeCell = document.createElement("td");
    removeCell.className = "basket-remove";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + product.name);
    removeButton.addEventListener("click", function () {
        removeFromBasket(product.id);
        showBasket();
    });

    removeCell.append(removeButton);

    row.append(productCell, priceCell, quantityCell, totalCell, removeCell);
    return row;
}
