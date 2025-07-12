const User = require('../models/User');

/**
 * Check if an username is already associated with an existing user.
 *
 * This function queries the database to determine if a user with the given username already exists.
 *
 * @param {string} username - The username to check.
 * @returns {<boolean>} - Returns true if the username is taken, false otherwise.
 */
async function isUsernameTaken(username) {
  const user = await User.findOne({ username });
  return !!user;
}

module.exports = isUsernameTaken;