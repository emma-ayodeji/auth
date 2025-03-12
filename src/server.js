const express = require("express");
const cors = require("cors");
const axios = require("axios"); // To call the Microsoft Graph API
const { getAuthCodeUrl, acquireTokenByCode } = require("./auth"); // Import auth.js methods

const app = express();
const port = 3000;

// Middleware to allow cross-origin requests
app.use(cors());

// Function to fetch user roles from Microsoft Graph API
async function fetchUserRoles(accessToken) {
    try {
        const response = await axios.get("https://graph.microsoft.com/v1.0/me/memberOf", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const roles = response.data.value.map(item => item.displayName); // Extract roles from groups
        return roles;
    } catch (error) {
        console.error("Error fetching roles from Microsoft Graph API:", error);
        throw error;
    }
}

// Middleware to check user roles
async function checkRole(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];  // Extract token

    if (!token) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    try {
        const roles = await fetchUserRoles(token); // Fetch roles using the token
        req.roles = roles;  // Add roles to the request object for further use
        next();
    } catch (error) {
        return res.status(500).send("Error fetching roles");
    }
}

// Login route - This will call the `getAuthCodeUrl` method from auth.js
app.get("/login", async (req, res) => {
    try {
        const authCodeUrl = await getAuthCodeUrl();
        res.json({ url: authCodeUrl });  // Send the URL to the client
    } catch (error) {
        res.status(500).send(error);
    }
});

// Callback route to handle the Azure login callback
app.get("/", async (req, res) => {
    const authCode = req.query.code; // Get the auth code from the URL query string

    try {
        const accessToken = await acquireTokenByCode(authCode);  // Get the access token
        res.send(`Access Token: ${accessToken}`);  // Send the token back (for testing purposes)
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Protected route that requires a specific role (e.g., "Admin")
app.get("/admin", checkRole, (req, res) => {
    const { roles } = req;

    // Check if the user has the 'Admin' role
    if (roles && roles.includes("Admin")) {
        res.send("Welcome to the admin page!");
    } else {
        res.status(403).send("Forbidden: You do not have the necessary role");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
