import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import apiClient from './apiClient';

// .css imports
import '../styles/loadingRing.css';

/**
 * ProtectedRoute Component
 *
 * This component is used to protect routes in the application by ensuring that only
 * authenticated users can access them. It checks the users authentication status by making
 * an API request to the backend and either renders the protected component or redirects
 * the user to the landing page if they are not authenticated.
 *
 * For use in App.js
 * EXAMPLE USAGE: <Route path="/your_route" element={<ProtectedRoute element={YourPage} />}
 *
 * @param {React.Component} element - The component to render if the user is authenticated.
 *
 * @returns {React.Component | Element} - The protected component if authenticated, or a redirect to the login page.
 */

const ProtectedRoute = ({ element: Component }) => {
  // State to keep track of whether the user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // useEffect to check authentication status when the component mounts
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Trying to Authenticate")
      try {
        // Make an API call to check if the user is authenticated
        await apiClient.get('api/users/check_token');
        setIsAuthenticated(true); // If the request is successful, set isAuthenticated to true
        console.log("Authenticated")
      } catch (error) {
        setIsAuthenticated(false); // If the request fails, set isAuthenticated to false
        console.log(" Not Authenticated")
      }
    };

    checkAuth(); // Call the function to check authentication
  }, []);

  // If the authentication status is still being determined, show a loading message
  if (isAuthenticated === null) {
    return (
      <div className="loading-container">
        <div className="loading-text"><div className="lds-ring"><div></div><div></div><div></div><div></div></div></div>
      </div>
    );
}

  // If the user is authenticated, render the protected component; otherwise, redirect to the lannding page
  return isAuthenticated ? <Component /> : <Navigate to="/" />;
};

export default ProtectedRoute;