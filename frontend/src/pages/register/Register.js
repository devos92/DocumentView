import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Logo from '../../components/Logo';
import ScrollingBackground from '../../components/ScrollingBackground';
import { useUser } from '../../context/UserContext';
import PasswordRules from './../../components/PasswordRules';
import './../../index.css';

/**
 * Register component for handling user registration.
 * The user is guided through a multi-step form to enter their email, username,
 * and password. Client-side validation is implemented for form inputs and
 * feedback is provided for errors. Upon successful registration,
 * the user is redirected to the dashboard.
 */
const Register = () => {
    const navigate = useNavigate(); // React Router hook for programmatic navigation
    const location = useLocation(); // Hook to access current location state

    // State hooks for managing user input, validation errors, and form steps
    const [email, setEmail] = useState(location.state?.email || ''); // Pre-fill email if passed from previous page
    const [username, setName] = useState(''); // Username input
    const [password, setPassword] = useState(location.state?.password || ''); // Pre-fill password if passed from previous page
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirmation password input
    const [error, setError] = useState(''); // General error state
    const [emailError, setEmailError] = useState(''); // Email validation error
    const [isEmailValid, setIsEmailValid] = useState(false); // Track email validation
    const [passwordFocused, setPasswordFocused] = useState(false); // Track password input focus
    const [showPasswordRules, setShowPasswordRules] = useState(false); // Toggle password rules display
    const [showConfirmPassword, setShowConfirmPassword] = useState(!!location.state?.password); // Toggle confirm password field visibility
    const [step, setStep] = useState(1); // Track current form step (1 or 2)
    const { setUser } = useUser(); // Hook to set authenticated user in context

    /**
     * useEffect to check the validity of the email from location state and to manage password focus.
     * If an email is passed via location, its availability is checked, and the user progresses to step 2.
     * Additionally, this hook handles the display of password rules when the password input is focused.
     */
    useEffect(() => {
        const checkEmail = async () => {
            if (location.state?.email) {
                await handleEmailSubmit();
            }
        };

        checkEmail();

        // Toggle password rules display based on input focus
        const handleFocus = passwordFocused;
        const timer = setTimeout(() => {
            setShowPasswordRules(handleFocus);
        }, 200);

        return () => clearTimeout(timer); // Cleanup timer
    }, [location.state, passwordFocused]);

    // Handlers for focusing and blurring the password field, controlling password rules display
    const handlePasswordFocus = () => setPasswordFocused(true);
    const handlePasswordBlur = () => setPasswordFocused(false);

    /**
     * Handle changes to the email input field and clear any existing email validation errors.
     * @param {Object} e - The event object from the input change event.
     */
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setEmailError(''); // Clear email error when input changes
    };

    /**
     * Handle changes to the password input field. Toggle the confirm password field based on input presence.
     * @param {Object} e - The event object from the input change event.
     */
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setShowConfirmPassword(!!e.target.value); // Show confirm password if password input exists
    };

    /**
     * Handle the submission of the email step in the registration form.
     * Performs validation and checks the availability of the email.
     * If the email is valid and available, the user progresses to step 2.
     * @returns {boolean} - Returns true if the email is valid and available.
     */
    const handleEmailSubmit = async () => {
        if (!email.trim()) {
            setEmailError('Email is required.');
            return false;
        }

        if (!validateEmail(email.trim())) {
            setEmailError('Please enter a valid email address.');
            return false;
        }

        const result = await isEmailTaken(email);
        if (result instanceof Error) {
            setEmailError('An error occurred while checking email availability.');
            return false;
        } else if (result) {
            setEmailError('Email is already in use.');
            return false;
        } else {
            setStep(2); // Move to the next step if email is valid
            return true;
        }
    };

    /**
     * Validate the email format using a regular expression.
     * @param {string} email - The email input to validate.
     * @returns {boolean} - Returns true if the email is valid.
     */
    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        const valid = re.test(String(email).trim().toLowerCase());
        return valid;
    };

    /**
     * Validates the user's password against specific rules:
     * - Minimum length: 8 characters
     * - At least one uppercase letter, number, and special character
     * - No spaces allowed
     *
     * @param {string} password - The password to validate.
     * @returns {boolean} - Returns true if the password passes all validations.
     */
    const validatePassword = (password) => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password must include at least one uppercase letter.');
            return false;
        }
        if (!/\d/.test(password)) {
            setError('Password must include at least one number.');
            return false;
        }
        if (!/[\W_]/.test(password)) {
            setError('Password must include at least one special character.');
            return false;
        }
        if (/\s/.test(password)) {
            setError('Password must not contain spaces.');
            return false;
        }
        return true;
    };

    /**
     * Check if the email is already in use by querying the API.
     * @param {string} emailToCheck - The email to check for availability.
     * @returns {boolean} - Returns true if the email is taken.
     */
    const isEmailTaken = async (emailToCheck) => {
        if (!emailToCheck) return true;
        try {
            const response = await apiClient.post('/api/users/check_email', { email: emailToCheck.trim() });
            return response.data.taken;
        } catch (error) {
            console.error('Error checking email availability:', error);
            return error;
        }
    };

    /**
     * Handle the full form submission for registration.
     * Validates username, password, and checks that passwords match before sending data to the API.
     * On success, the user is navigated to the dashboard.
     */
    const onSubmit = async (e) => {
        e.preventDefault(); // Prevent default form behaviour

        // Step 1: Email validation
        if (step === 1) {
            await handleEmailSubmit();
        } else {
            // Step 2: Validate other fields and submit form
            if (!username.trim()) {
                setError('Username is required.');
                return;
            }

            if (!password.trim()) {
                setError('Password is required.');
                return;
            }

            if (!validatePassword(password.trim())) {
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }

            try {
                // Submit registration data to the API
                const response = await apiClient.post('/api/users/register', {
                    username,
                    email: email.trim(),
                    password: password.trim(),
                });

                // Handle the server response
                if (response.data.success) {
                    setUser(response.data.user); // Set user in context
                    navigate('/dashboard'); // Redirect to dashboard on success
                } else if (response.data.error) {
                    setError(response.data.error); // Handle specific server errors
                }
            } catch (error) {
                // Handle generic or server-side errors
                if (error.response && error.response.data && error.response.data.error) {
                    setError(error.response.data.error);
                } else {
                    setError('An error occurred. Please try again later.');
                }
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {/* Background Animation */}
            <ScrollingBackground />

            {/* Logo */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-center p-4">
                <Logo className="truncate text-neutral xs:text-base md:text-lg lg:text-4xl" navigate={navigate} useClick={true} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg mx-auto"
                >
                    <div className="text-center my-6">
                        <h1 className="text-3xl font-semibold text-dark">Register</h1>
                        <p className="text-gray-600">Create your account</p>
                    </div>

                    {/* Display general error messages */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    {/* Form for registration */}
                    <form onSubmit={onSubmit}>
                        {step === 1 && (
                            <div className="mb-6">
                                <label htmlFor="email" className="block mb-2 text-dark">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="example@example.com"
                                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {/* Display email validation errors */}
                                {emailError && <div className="text-sm text-red-600 mt-2">{emailError}</div>}
                                <div className="mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={handleEmailSubmit}
                                        className={`w-full bg-primary text-white py-2 rounded transition duration-200 ${!email.trim() || emailError ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-primaryHover'}`}
                                        disabled={!email.trim() || emailError}
                                    >
                                        Next
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: User inputs username and password */}
                        {step === 2 && (
                            <>
                                <div className="mb-6">
                                    <label htmlFor="username" className="block mb-2 text-dark">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        autoComplete="username"
                                        value={username}
                                        placeholder="MyUsername123"
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="password" className="block mb-2 text-dark">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        placeholder="••••••••••••"
                                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                        onFocus={handlePasswordFocus}
                                        onBlur={handlePasswordBlur}
                                    />
                                    {/* Password rules are shown when the password field is focused */}
                                    <div className='mt-6'>
                                        {showPasswordRules && <PasswordRules password={password} />}
                                    </div>
                                </div>
                                {/* Display confirm password input if password has been entered */}
                                {showConfirmPassword && (
                                    <div className="mb-6">
                                        <label htmlFor="confirmPassword" className="block mb-2 text-dark">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                )}
                                {/* Navigation buttons for back and submit */}
                                <div className="mb-6 flex justify-between">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setName('');
                                            setPassword('');
                                            setConfirmPassword('');
                                            setShowConfirmPassword(false);
                                            setError('');
                                        }}
                                        className="w-full bg-primary text-white py-2 rounded hover:bg-secondaryHover transition duration-200 mr-2"
                                    >
                                        Back
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        className={`w-full bg-primary text-white py-2 rounded hover:bg-primaryHover transition duration-200 ml-2 ${!username.trim() || !password.trim() || !confirmPassword.trim() ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                        disabled={!username.trim() || !password.trim() || !confirmPassword.trim()}
                                    >
                                        Register
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </form>

                    {/* Link to the sign-in page, only visible during the email step */}
                    {step === 1 && (
                        <p className="text-sm text-center text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" state={{ email, password }} className="font-semibold text-primary focus:outline-none focus:underline">Sign in</Link>.
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
