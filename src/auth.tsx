import React, { useState, useEffect } from 'react';
import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig } from './auth-config'; // Your configuration

const msalInstance = new PublicClientApplication(msalConfig);

const AuthComponent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if the user is authenticated
  useEffect(() => {
    const checkAccount = async () => {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true);
      }
    };
    checkAccount();
  }, []);

  // Login handler - Redirects the user to Azure AD
  const handleLogin = async () => {
    try {
      const loginResponse = await msalInstance.loginRedirect({
        scopes: ['user.read'],
      });
      console.log('Login success:', loginResponse);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Fetch access token
  const fetchAccessToken = async () => {
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['user.read'],
      });
      setAccessToken(tokenResponse.accessToken);
      console.log('Access Token:', tokenResponse.accessToken);
    } catch (error) {
      console.error('Error acquiring token:', error);
      if (error instanceof InteractionRequiredAuthError) {
        // If silent token acquisition fails, fallback to popup
        msalInstance.acquireTokenPopup({
          scopes: ['user.read'],
        }).then((response) => {
          setAccessToken(response.accessToken);
          console.log('Access Token (popup):', response.accessToken);
        }).catch((popupError) => {
          console.error('Popup token acquisition failed:', popupError);
        });
      }
    }
  };

  // Logout handler
  const handleLogout = () => {
    msalInstance.logout();
    setIsAuthenticated(false);
    setAccessToken(null);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <div>
          <button onClick={handleLogin}>Login with Azure AD</button>
        </div>
      ) : (
        <div>
          <h3>Welcome! You are logged in.</h3>
          <button onClick={fetchAccessToken}>Get Access Token</button>
          {accessToken && <p>Access Token: {accessToken}</p>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
