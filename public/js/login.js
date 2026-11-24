/*
 * login.js
 * Browser side of the login page.
 * 1. Checks that the email and password were filled in.
 * 2. Sends them to the server with fetch(). If the login is correct,
 *    the server starts a session and the user goes to the home page.
 */

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
    // Stop the browser from reloading the page; JavaScript sends the data instead
    event.preventDefault();

    clearErrors();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    let valid = true;

    // Email: simple format check, text@text.text with no spaces
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        showError("email", "Please enter a valid email address.");
        valid = false;
    }

    // Password: only needs to be filled in (the server checks if it is correct)
    if (password === "") {
        showError("password", "Please enter your password.");
        valid = false;
    }

    if (!valid) {
        return;
    }

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            // Login correct: show the welcome message, then open the home page
            showStatus(data.message, "success");
            setTimeout(function () {
                window.location.href = "index.html";
            }, 1500);
        } else {
            // 400 (invalid data), 401 (wrong email or password),
            // 429 (too many attempts) or 500 (server error)
            showStatus(data.message, "error");
            document.getElementById("password").value = "";
        }
    } catch (error) {
        // fetch() fails when the server is not running or there is no connection
        showStatus("Could not connect to the server. Please try again.", "error");
    }
});

// Show an error message under the field that needs attention
function showError(fieldId, message) {
    document.getElementById(fieldId + "Error").textContent = message;
    document.getElementById(fieldId).classList.add("invalid");
}

// Remove all previous error messages before checking the form again
function clearErrors() {
    document.querySelectorAll(".form-error").forEach(function (error) {
        error.textContent = "";
    });

    document.querySelectorAll(".invalid").forEach(function (field) {
        field.classList.remove("invalid");
    });

    showStatus("", "");
}

// Show the general message at the bottom of the form ("success" or "error").
// textContent (not innerHTML) is used so text can never run as HTML (XSS protection).
function showStatus(message, type) {
    const status = document.getElementById("formStatus");
    status.textContent = message;
    status.className = "status " + type;
}
