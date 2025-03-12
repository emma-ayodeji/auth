import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";

const AdminPage = () => <div>Admin Dashboard</div>;
const UserPage = () => <div>User Dashboard</div>;
const HomePage = () => <div>Home Page</div>;

const App = () => {
  const { user, logout } = useAuth();

  return (
    <Router>
      <div>
        {!user ? (
          <Login />  // Use the Login component for authentication
        ) : (
          <div>
            <h2>Welcome, {user.username}!</h2>
            <p>Role: {user.role}</p>
            <button onClick={logout}>Logout</button>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <UserPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
