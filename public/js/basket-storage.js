/*
 * basket-storage.js
 * Shared functions to read and change the shopping basket.
 * Loaded on every page (before nav.js) so the menu can show the item count.
 *
 * The basket is kept in the browser's localStorage, so it is not lost when
 * the user changes page or closes the tab. Only the product id and the
 * quantity are stored, e.g. [{ "id": 3, "quantity": 2 }].
 * Names and prices are always read from the database, so the price shown
 * is the real one and cannot be changed by editing the browser storage.
 */

// Name of the localStorage entry that holds the basket
const BASKET_KEY = "naturaEssenceBasket";

// Read the basket. Returns an empty list if there is no basket yet
// or if the stored text is damaged.
function getBasket() {
    try {
        const saved = JSON.parse(localStorage.getItem(BASKET_KEY));

        if (!Array.isArray(saved)) {
            return [];
        }

        // Keep only valid lines: whole-number id and quantity of at least 1.
        // localStorage can be edited by the user, so its content is not trusted.
        return saved.filter(function (line) {
            return line !== null && Number.isInteger(line.id) && Number.isInteger(line.quantity) && line.quantity >= 1;
        });
    } catch (error) {
        return [];
    }
}

// Save the basket (localStorage only stores text, so the list becomes JSON)
function saveBasket(basket) {
    try {
        localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
    } catch (error) {
        console.log("Could not save the basket:", error);
    }
}

// Add one unit of a product. If it is already in the basket,
// increase its quantity instead of adding a second line.
function addToBasket(productId) {
    const basket = getBasket();
    const item = basket.find(function (line) {
        return line.id === productId;
    });

    if (item) {
        item.quantity = item.quantity + 1;
    } else {
        basket.push({ id: productId, quantity: 1 });
    }

    saveBasket(basket);
}

// Change the quantity of a product (the minimum is 1; "Remove" deletes the line)
function setBasketQuantity(productId, quantity) {
    const basket = getBasket();
    const item = basket.find(function (line) {
        return line.id === productId;
    });

    if (item && quantity >= 1) {
        item.quantity = quantity;
        saveBasket(basket);
    }
}

// Remove a product from the basket completely
function removeFromBasket(productId) {
    const basket = getBasket().filter(function (line) {
        return line.id !== productId;
    });

    saveBasket(basket);
}

// Total number of units in the basket (e.g. 2 teas + 1 oil = 3)
function getBasketCount() {
    return getBasket().reduce(function (total, line) {
        return total + line.quantity;
    }, 0);
}

// Show the number of units in the menu: "Basket (3)", or just "Basket" when empty
function updateBasketLink() {
    const count = getBasketCount();

    document.querySelectorAll(".basket-link").forEach(function (link) {
        link.textContent = count > 0 ? "Basket (" + count + ")" : "Basket";
    });
}
