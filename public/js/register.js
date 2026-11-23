/*
 * register.js
 * Browser side of the registration page.
 * 1. Checks the form fields and shows an error under each wrong field
 *    (same approach as the contact form of my CA1 website).
 * 2. If everything is correct, sends the data to the server with fetch()
 *    and shows the server's answer to the user.
 */

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
    // Stop the browser from reloading the page; JavaScript sends the data instead
    event.preventDefault();

    clearErrors();

    // Read the values typed by the user (trim removes spaces at the start and end)
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    let valid = true;

    // Name: required, at least 2 characters
    if (name.length < 2) {
        showError("name", "Please enter your full name (at least 2 characters).");
        valid = false;
    }

    // Email: simple format check, text@text.text with no spaces
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        showError("email", "Please enter a valid email address.");
        valid = false;
    }

    // Password: at least 8 characters, with at least one letter and one number
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        showError("password", "Password must be at least 8 characters and include a letter and a number.");
        valid = false;
    }

    // Confirm password: must be exactly the same as the password
    if (confirmPassword !== password || confirmPassword === "") {
        showError("confirmPassword", "Passwords do not match.");
        valid = false;
    }

    if (!valid) {
        showStatus("Please review the highlighted fields.", "error");
        return;
    }

    // All fields are valid: send them to the server as JSON
    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, email: email, password: password })
        });

        // The server always answers with { message: "..." }
        const data = await response.json();

        if (response.ok) {
            // Status 201: account created, so clear the form
            showStatus(data.message, "success");
            registerForm.reset();
        } else {
            // Status 400, 409 or 500: show the server's message
            showStatus(data.message, "error");
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

// Show the general message at the bottom of the form.
// type is "success" (green) or "error" (red).
// textContent (not innerHTML) is used so text can never run as HTML (XSS protection).
function showStatus(message, type) {
    const status = document.getElementById("formStatus");
    status.textContent = message;
    status.className = "status " + type;
}
