/*
 * nav.js
 * Every page loads this file (after basket-storage.js).
 * 1. Shows how many items are in the basket: "Basket (3)".
 * 2. Asks the server if a user is logged in and changes the "Login"
 *    links in the header and footer to "Logout".
 * When the user clicks "Logout", the session ends and the home page opens.
 */

// Run as soon as the page loads
updateBasketLink();
updateAuthLinks();

async function updateAuthLinks() {
    try {
        // GET /api/session answers { loggedIn: true, name: "..." } or { loggedIn: false }
        const response = await fetch("/api/session");
        const data = await response.json();

        if (!data.loggedIn) {
            return; // nobody logged in: keep the "Login" links as they are
        }

        // Every link with the class "auth-link" (header and footer) becomes "Logout"
        document.querySelectorAll(".auth-link").forEach(function (link) {
            link.textContent = "Logout";
            link.href = "#";
            link.classList.remove("active");
            link.removeAttribute("aria-current");
            link.addEventListener("click", logout);
        });
    } catch (error) {
        // If the server does not answer, keep the "Login" links
        console.log("Could not check the session:", error);
    }
}

async function logout(event) {
    // The link has href="#", so stop the browser from jumping to the top of the page
    event.preventDefault();

    try {
        await fetch("/api/logout", { method: "POST" });
    } catch (error) {
        console.log("Could not log out:", error);
    }

    // Back to the home page, where the menu shows "Login" again
    window.location.href = "index.html";
}
