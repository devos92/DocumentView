const User = require('../models/User');

/**
 * Check if an email is already associated with an existing user.
 *
 * This function queries the database to determine if a user with the given email already exists.
 *
 * @param {string} email - The email to check.
 * @returns {<boolean>} - Returns true if the email is taken, false otherwise.
 */
async function isEmailTaken(email) {
  const user = await User.findOne({ email });
  return !!user;
}

module.exports = isEmailTaken;