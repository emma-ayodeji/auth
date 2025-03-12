const express = require("express");
const cors = require("cors");
const axios = require("axios"); // For making requests to Microsoft Graph API
const { getAuthCodeUrl, acquireTokenByCode } = require("./auth"); // Import auth.js methods
const jwt = require("jsonwebtoken"); // JWT library to verify token (ensure this is installed)

const app = express();
const port = 3000;

// Middleware to allow cross-origin requests
app.use(cors());

// Middleware to check for JWT and verify it
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    try {
        // Decode and verify JWT token using a secret or public key from Azure AD
        // You can also verify the token using MSAL or by checking with Microsoft Graph API
        const decoded = jwt.decode(token); // Decode JWT (you can also use jwt.verify if you have a secret)
        
        // If decoding succeeds, attach user information to request for later use
        req.user = decoded;  // Attach the decoded user info to the request

        next(); // Proceed to next middleware or route handler
    } catch (error) {
        return res.status(401).send("Unauthorized: Invalid token");
    }
};

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

// Protected route to fetch user info (using RBAC)
app.get("/user-info", verifyToken, async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    try {
        // Call Microsoft Graph API to fetch the user info based on the token
        const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${token}`, // Pass the access token to the Graph API
            },
        });

        // Extract user info and roles from Microsoft Graph API response
        const userInfo = response.data; // Microsoft Graph response with user details

        // Optional: Fetch roles (if you have RBAC roles stored in Azure AD)
        const roles = await getRolesFromAzureAD(token);

        res.json({
            userInfo,
            roles,
        });
    } catch (error) {
        console.error("Error fetching user info from Microsoft Graph:", error);
        res.status(500).send("Error fetching user data");
    }
});

// Function to fetch roles from Microsoft Graph API (you may need to adjust this based on your Azure AD setup)
const getRolesFromAzureAD = async (token) => {
    try {
        const rolesResponse = await axios.get("https://graph.microsoft.com/v1.0/me/memberOf", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const roles = rolesResponse.data.value.map((role) => role.displayName);
        return roles;
    } catch (error) {
        console.error("Error fetching roles from Microsoft Graph:", error);
        return [];
    }
};

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
