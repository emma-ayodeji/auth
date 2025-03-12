import React, { useState, useEffect } from "react";
import Login from "./Login";  // Import Login component

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Check if the user is authenticated (e.g., check for token in localStorage)
    useEffect(() => {
        const token = localStorage.getItem("accessToken"); // Or use cookies for token storage
        if (token) {
            // Optionally verify the token or check user details here
            setIsAuthenticated(true);
        }
    }, []);

    // Fetch user info after login (or token validation)
    const fetchUserData = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:3000/user-info", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            const data = await response.json();
            setUserInfo(data);  // Set user info once fetched
        } catch (error) {
            console.error("Failed to fetch user data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            {!isAuthenticated ? (
                // Show Login component if not authenticated
                <Login />
            ) : (
                // Show user info once authenticated
                <div>
                    <h2>Welcome, {userInfo ? userInfo.name : "User"}</h2>
                    <button onClick={fetchUserData} disabled={loading}>
                        {loading ? "Fetching..." : "Fetch User Info"}
                    </button>
                    <div>
                        {userInfo ? (
                            <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                        ) : (
                            <p>No user info available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
