const express = require("express");
const cors = require("cors");
const session = require("express-session"); // Add session support
const { getAuthCodeUrl, acquireTokenByCode } = require("./auth"); // Import auth functions
const axios = require("axios");

const app = express();
const port = 3000;

// Middleware to allow cross-origin requests
app.use(cors({
    origin: "http://localhost:5173", // Allow frontend requests (adjust as needed)
    credentials: true
}));

// Session middleware (to store user session data)
app.use(session({
    secret: "your_secret_key", // Change this to a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `true` if using HTTPS
}));

// Login route - Redirect user to Microsoft login
app.get("/login", async (req, res) => {
    try {
        const authCodeUrl = await getAuthCodeUrl();
        res.json({ url: authCodeUrl });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Authentication error.");
    }
});

// Callback route - Handle Azure login callback
app.get("/callback", async (req, res) => {
    const authCode = req.query.code; // Extract the authorization code from query

    if (!authCode) {
        return res.status(400).send("Missing authorization code.");
    }

    try {
        const accessToken = await acquireTokenByCode(authCode); // Get access token

        // Fetch user info from Microsoft Graph API
        const userInfo = await axios.get("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Extract user details
        const user = {
            username: userInfo.data.displayName,
            email: userInfo.data.mail || userInfo.data.userPrincipalName,
            role: "user" // You can extend this with Azure AD role mapping
        };

        // Store user in session
        req.session.user = user;

        res.redirect("http://localhost:5173"); // Redirect to frontend
    } catch (error) {
        console.error("Error handling callback:", error);
        res.status(500).send("Error during authentication.");
    }
});

// Logout route - Clear session
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.send("Logged out");
    });
});

// Protected route - Get current user session
app.get("/user", (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).send("Not authenticated");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
