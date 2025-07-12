require('dotenv').config();
const express = require('express');
const User = require('../models/User');
const RefreshToken = require('../models/refreshToken');
const authenticateToken = require('../middleware/authenticateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const validateEmail = require("../utils/validateEmail");
const validatePassword = require("../utils/validatepassword");
const isEmailTaken = require("../utils/isEmailTaken");
const isUsernameTaken = require("../utils/isUsernameTaken");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Route to register a new user.
 *
 * This route handles user registration by validating the provided email and password,
 * hashing the password, and storing the new user's data in the database. A JWT token
 * is generated for the new user and sent as a cookie in the response.
 *
 * @name POST /users/register
 * @function
 * @memberof module:routes/users
 * @param {Object} req.body - The user data (username, email, password).
 * @param {Object} res - The response object.
 */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate the provided email and password
    validateEmail(email);
    validatePassword(password);

    // Check if the email or username is already taken
    if (await isEmailTaken(email)) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    if (await isUsernameTaken(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user with default 'user' role
    const user = new User({
      username,
      email,
      password_hash: hashedPassword,
      role: 'user', // Assign default role as 'user'
    });

    const newUser = await user.save();

    // Generate JWT payload
    const payload = {
      id: newUser._id,
      role: newUser.role,
    };

    // Sign the JWT token
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    // Generate a refresh token
    const refreshToken = await generateRefreshToken(newUser._id);

    // Set the access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 3600000, // 1 hour
    });

    // Set the refresh token cookie
    res.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    console.error('Error saving user:', error);
    return res.status(500).json({ error: 'Error saving user', details: error.message });
  }
});

/**
 * Route to log in an existing user.
 *
 * This route handles user login by verifying the provided email and password.
 * If successful, a JWT token is generated and sent as a cookie in the response.
 *
 * @name POST /users/login
 * @function
 * @memberof module:routes/users
 * @param {Object} req.body - The login credentials (email, password).
 * @param {Object} res - The response object.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists with the given email
    const user = await User.findOne({ email });

    if (!user) {
      // Specific error for non-existing email
      return res.status(400).json({
        success: false,
        error: 'invalid-email',
        message: 'No account found with this email address.'
      });
    }

    // Validate password
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      // Specific error for incorrect password
      return res.status(400).json({
        success: false,
        error: 'invalid-password',
        message: 'Incorrect password. Please try again.'
      });
    }

    // User is authenticated, generate JWT token
    const payload = {
      id: user._id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    // Set access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 3600000, // 1 hour
    });

    // Check or generate refresh token
    let refreshToken = await RefreshToken.findOne({ userId: user._id });
    if (!refreshToken) {
      refreshToken = await generateRefreshToken(user._id);
    }

    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with success and user data
    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Error during login', details: error.message });
  }
});



/**
 * Route to log out a user.
 *
 * On logout the access token and the refresh token are destroyed.
 *
 * @name POST /users/logout
 * @function
 * @memberof module:routes/users
 * @param {Object} req.cookies - The cookie containing the refresh token.
 * @param {Object} res - The response object.
 */
router.post('/logout', authenticateToken, async (req, res) => {
  const { refresh_token: refreshToken } = req.cookies;

  if (refreshToken) {
    try {
      await RefreshToken.findOneAndDelete({ token: refreshToken });
    } catch (error) {
      console.error('Error during logout:', error);
      return res.status(500).send('Error during logout');
    }
  }

  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return res.status(200).send('Logged out successfully');
});

/**
 * Route to validate a user token.
 *
 * This route is used to validate users so they can't access protected routes,
 * Used in protectedRoutes.js
 *
 * @name GET /users/check_token
 * @function
 * @memberof module:routes/users
 * @param {Object} res - The response object.
 */
router.get('/check_token', authenticateToken, (req, res) => {
  return res.status(200).json({ message: 'Token is valid' });
});

/**
 * Route to determine if an email is already taken.
 *
 * This route is used to check if an email is already taken during registration.
 *
 * @name POST /users/check_email
 * @function
 * @memberof module:routes/users
 * @param {Object} req.body.email - The email to check.
 * @param {Object} res - The response object.
 */
router.post('/check_email', async (req, res) => {
  const { email } = req.body;

  try {
    const isTaken = await isEmailTaken(email);
    res.json({ taken: isTaken });
  } catch (error) {
    res.status(500).json({
      error: 'Error checking email',
      details: error.message,
    });
  }
});

/**
 * Route to retrieve the current user.
 *
 * This route is used to retrieve the currently logged-in user by their ID from the database.
 *
 * @name GET /users/me
 * @function
 * @memberof module:routes/users
 * @param {Object} res - The response object.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching user details',
      details: error.message,
    });
  }
});

/**
 * Route to retrieve a user by ID
 *
 * This route is used to retrieve a user by their ID from the database.
 *
 * @name GET /users/:id
 * @function
 * @memberof module:routes/users
 * @param {Object} req.params.id - The user ID.
 * @param {Object} res - The response object.
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching user details',
      details: error.message,
    });
  }
});

/**
 * Route to retrieve all users.
 *
 * This route is used to retrieve all users from the database.
 * The route is protected and only accessible by admin users.
 *
 * @name GET /users/all
 * @function
 * @memberof module:routes/users
 * @param {Object} res - The response object.
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).send('You are not authorised to view users');
    }

    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching users',
      details: error.message,
    });
  }
});

/**
 * Route to update the username of the currently logged-in user.
 *
 * This route allows users to change their username after performing necessary validations.
 *
 * @name PUT /users/update-username
 * @function
 * @memberof module:routes/users
 * @param {Object} req.body.username - The new username.
 * @param {Object} res - The response object.
 */
router.put('/update-username', authenticateToken, async (req, res) => {
  const { username } = req.body;

  try {
    // Check if the username is taken
    if (await isUsernameTaken(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Find the logged-in user by ID and update their username
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      username: updatedUser.username,
    });
  } catch (error) {
    console.error('Error updating username:', error);
    return res.status(500).json({ error: 'Error updating username', details: error.message });
  }
});


/**
 * Route to update the password of the currently logged-in user.
 *
 * This route allows users to change their password after performing necessary validations.
 *
 * @name PUT /users/update-password
 * @function
 * @memberof module:routes/users
 * @param {Object} req.body.password - The new password.
 * @param {Object} res - The response object.
 */
router.put('/update-password', authenticateToken, async (req, res) => {
  const { password } = req.body;

  try {
    // Validate the password against the defined rules
    validatePassword(password);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Find the logged-in user by ID and update their password
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { password_hash: hashedPassword },
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ error: 'Error updating password', details: error.message });
  }
});



/**
 * Route to delete a user by ID.
 *
 * This route is used to delete a user by ID.
 * The route is protected and only accessible by admin users.
 *
 * @name DELETE /users/delete/:id
 * @function
 * @memberof module:routes/users
 * @param {Object} req.params.id - The user ID.
 * @param {Object} res - The response object.
 */
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).send('You are not authorised to delete users');
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).send('User deleted');
  } catch (error) {
    res.status(500).json({
      error: 'Error deleting user',
      details: error.message,
    });
  }
});

module.exports = router;
