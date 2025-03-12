import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Define User type
interface User {
  username: string;
  role: string; // e.g., 'admin' or 'user'
  accessToken: string;
}

// Create authentication context
const AuthContext = createContext<{
  user: User | null;
  login: () => void;
  logout: () => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
});

// Custom hook to access AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if the URL contains an authorization code (callback from Microsoft)
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("code");

    if (code) {
      fetchToken(code);
    }
  }, [location]);

  // Function to initiate login by redirecting to Microsoft login
  const login = async () => {
    try {
      const response = await fetch("http://localhost:3000/login"); // Backend API call
      const data = await response.json();
      window.location.href = data.url; // Redirect to Microsoft login
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Function to exchange auth code for an access token
  const fetchToken = async (code: string) => {
    try {
      const response = await fetch("http://localhost:3000/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.accessToken) {
        // Fetch user info (replace with a real API call)
        const userInfo: User = {
          username: "John Doe", // Ideally fetched from Microsoft Graph API
          role: "admin", // Assign role based on user's group or API response
          accessToken: data.accessToken,
        };

        setUser(userInfo);
        localStorage.setItem("user", JSON.stringify(userInfo));
        navigate("/dashboard"); // Redirect to a protected page
      }
    } catch (error) {
      console.error("Token fetch failed:", error);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
