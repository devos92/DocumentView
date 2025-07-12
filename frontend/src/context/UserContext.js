/**
 * User Context and Provider
 *
 * This module provides a `UserContext` using React Context API to manage the current user's state
 * throughout the application. It allows components to access and modify user information,
 * and persists the user data in `localStorage` to maintain session across page refreshes.
 *
 * Usage:
 * Use the `useUser` hook in any component to access or update the current user:
 *   import { useUser } from '../context/UserContext';
 *
 *   const Component = () => {
 *     const { user, setUser } = useUser();
 *
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// Create a Context for the User data
const UserContext = createContext();

/**
 * Custom hook to use the UserContext.
 * Provides access to the user data and the function to update it.
 *
 * @returns {Object} The current user object and the setUser function.
 */
export const useUser = () => useContext(UserContext);

/**
 * UserProvider component to wrap the application and provide user context.
 * Manages the user state and persists it to localStorage for persistence across sessions.
 *
 * @param {Object} children - The child components to be wrapped by the UserProvider.
 * @returns {JSX.Element} A provider component that supplies user data and management functions.
 */
export const UserProvider = ({ children }) => {
  // Initialize the user state, attempting to load from localStorage if available
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // useEffect hook to update localStorage whenever the user state changes
  useEffect(() => {
    if (user) {
      // If user is present, store it in localStorage
      localStorage.setItem('user', JSON.stringify(user));

    } else {
      // If user is null, remove the user from localStorage
      localStorage.removeItem('user');
    }
  }, [user]); // Dependency array ensures effect runs only when user state changes

  return (
    // Provide user context value to children components
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
