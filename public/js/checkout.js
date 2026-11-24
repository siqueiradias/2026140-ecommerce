/*
 * checkout.js
 * Simulated checkout:
 * 1. Shows a message if the basket is empty or if nobody is logged in.
 * 2. If not, shows the order review (products, quantities and total).
 * 3. "Place Order" sends the basket (ids and quantities only) to the server,
 *    which calculates the total with database prices and saves the order.
 * 4. Shows the confirmation with the order number and empties the basket.
 */

// Elements of checkout.html that this script uses
const checkoutStatus = document.getElementById("checkoutStatus");
const loginRequired = document.getElementById("loginRequired");
const checkoutEmpty = document.getElementById("checkoutEmpty");
const checkoutReview = document.getElementById("checkoutReview");
const orderConfirmation = document.getElementById("orderConfirmation");
const placeOrderButton = document.getElementById("placeOrderButton");

// Formats a number as euros, e.g. 7.95 -> "€7.95"
const priceFormat = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

loadCheckout();

async function loadCheckout() {
    // 1. Empty basket: nothing to check out
    if (getBasket().length === 0) {
        checkoutEmpty.hidden = false;
        return;
    }

    try {
        // 2. Ask the server if someone is logged in (GET /api/session)
        const sessionResponse = await fetch("/api/session");
        const session = await sessionResponse.json();

        if (!session.loggedIn) {
            loginRequired.hidden = false;
            return;
        }

        // 3. Load the current names and prices to show the order review
        const productsResponse = await fetch("/api/products");

        if (!productsResponse.ok) {
            throw new Error("Server answered with status " + productsResponse.status);
        }

        const products = await productsResponse.json();
        showReview(products);
    } catch (error) {
        console.log("Could not load the checkout:", error);
        checkoutStatus.textContent = "Sorry, we could not load the products. Please try again later.";
    }
}

// Show one line per product ("2 × Calm Mind Herbal Tea   €15.90") and the total.
// This total is only shown on screen. The server calculates the real one.
function showReview(products) {
    const list = document.getElementById("checkoutItems");
    list.textContent = "";
    let total = 0;

    getBasket().forEach(function (item) {
        const product = products.find(function (p) {
            return p.id === item.id;
        });

        if (!product) {
            return; // product is not in the database anymore: the server will reject it
        }

        const lineTotal = product.price * item.quantity;
        total = total + lineTotal;

        // createElement + textContent (not innerHTML) to protect against XSS
        const line = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = item.quantity + " × " + product.name;
        const price = document.createElement("span");
        price.textContent = priceFormat.format(lineTotal);

        line.append(name, price);
        list.append(line);
    });

    document.getElementById("checkoutTotal").textContent = priceFormat.format(total);
    checkoutReview.hidden = false;
}

// "Place Order" button
placeOrderButton.addEventListener("click", async function () {
    // Disable the button so the order cannot be sent twice by a double click
    placeOrderButton.disabled = true;
    checkoutStatus.textContent = "";

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: getBasket() })
        });

        const data = await response.json();

        if (response.ok) {
            // Status 201: order saved. Empty the basket and show the confirmation.
            saveBasket([]);
            updateBasketLink();

            document.getElementById("confirmationMessage").textContent = data.message;
            document.getElementById("confirmationTotal").textContent = "Order total: " + priceFormat.format(data.total);
            checkoutReview.hidden = true;
            orderConfirmation.hidden = false;
        } else if (response.status === 401) {
            // The session expired (e.g. after 2 hours): ask the customer to log in again
            checkoutReview.hidden = true;
            loginRequired.hidden = false;
        } else {
            // 400 (invalid items) or 500 (server error): show the server's message
            checkoutStatus.textContent = data.message;
            placeOrderButton.disabled = false;
        }
    } catch (error) {
        checkoutStatus.textContent = "Could not connect to the server. Please try again.";
        placeOrderButton.disabled = false;
    }
});
