import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Logo from '../../components/Logo';
import ScrollingBackground from '../../components/ScrollingBackground';
import { useUser } from '../../context/UserContext';
import './../../index.css';

/**
 * Login component handles the authentication of users.
 * It provides input fields for email and password, performs client-side validation,
 * and makes API requests to authenticate the user. Upon successful login,
 * the user is navigated to the dashboard.
 */
const Login = () => {
    // State to store email, password, and error messages
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Context hook to set the authenticated user
    const { setUser } = useUser();

    // React Router hooks for navigation and accessing location state
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * useEffect to pre-fill the email and password fields if provided through location state.
     * This could be useful when redirecting from the registration page, where the user is automatically
     * navigated to the login page.
     */
    useEffect(() => {
        if (location.state) {
            if (location.state.email) {
                setEmail(location.state.email);
            }
            if (location.state.password) {
                setPassword(location.state.password);
            }
        }
    }, [location.state]);

    /**
     * Function to validate the email format using a regular expression.
     * Ensures that the input adheres to the typical email structure.
     *
     * @param {string} email - The email address inputted by the user.
     * @returns {boolean} - True if the email is valid, otherwise false.
     */
    const validateEmail = (email) => {
        console.log('Validating email:', email); // Debugging email validation
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).trim().toLowerCase());
    };

    /**
     * Handles the form submission when the user attempts to log in.
     * It performs client-side validation for the email and password, and if valid,
     * it sends a login request to the server. On success, the user is navigated to the dashboard.
     *
     * @param {React.FormEvent} e - The form submission event.
     */
    const onSubmit = async (e) => {
        e.preventDefault();  // Prevent default form behaviour

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        // Perform client-side validation for empty fields and invalid email format
        if (!trimmedEmail) {
            setError('Email is required.');
            return;
        } else if (!validateEmail(trimmedEmail)) {
            setError('Not a valid email address. Please enter a valid email.');
            return;
        }

        if (!trimmedPassword) {
            setError('Password is required.');
            return;
        }

        try {
            // Send login request to the API
            const response = await apiClient.post('/api/users/login', {
                email: trimmedEmail,
                password: trimmedPassword,
            });

            // Handle the response from the server
            if (response.data.success) {
                // Successful login, set the user in context and navigate to dashboard
                setUser(response.data.user);
                navigate('/dashboard');
            } else {
                // Handle specific server-side validation errors
                if (response.data.error === 'invalid-email') {
                    setError('No account found with this email address.');
                } else if (response.data.error === 'invalid-password') {
                    setError('Incorrect password. Please try again.');
                } else {
                    setError('Invalid login credentials.');
                }
            }
        } catch (error) {
            console.error('Error during login:', error);

            // Check if the error is a server response error or a network issue
            if (error.response) {
                // Server returned an error response
                if (error.response.data && error.response.data.message) {
                    setError(error.response.data.message);
                } else {
                    setError('An error occurred. Please try again later.');
                }
            } else {
                // Network or other non-response related errors
                setError('A network error occurred. Please try again later.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {/* Background animation for a dynamic visual effect */}
            <ScrollingBackground />

            {/* Logo displayed at the top of the page */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-center p-4">
                <Logo className="truncate text-neutral xs:text-base md:text-lg lg:text-4xl" navigate={navigate} useClick={true} />
            </div>

            {/* Main container for the login form */}
            <div className="relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg mx-auto"
                >
                    <h2 className="text-2xl font-semibold text-center text-dark mb-6">Login</h2>

                    {/* Display error messages */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    {/* Form for user input */}
                    <form>
                        <div className="mb-4">
                            <label className="block text-dark mb-2" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                autoComplete="email"
                                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@example.com"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-dark mb-2" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                            />
                        </div>

                        {/* Submit button for login */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-primary text-white py-2 rounded hover:bg-primaryHover transition duration-200"
                            type="submit"
                            onClick={onSubmit}
                        >
                            Login
                        </motion.button>
                    </form>

                    {/* Link to the registration page for users who do not have an account */}
                    <p className="text-center text-dark mt-4">
                        Don't have an account yet? <Link to="/register" state={{ email }} className="font-semibold text-primary focus:outline-none focus:underline">Sign up</Link>.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
