const crypto = require('crypto');
const RefreshToken = require('../models/refreshToken');

/**
 * Generates and saves a refresh token for a user.
 *
 * This function generates a random refresh token, sets its expiration date to 7 days from the time of creation,
 * and associates it with the specified user. The refresh token is then saved to the database.
 *
 * @function generateRefreshToken
 * @param {mongoose.Schema.Types.ObjectId} userId - The ID of the user for whom the refresh token is generated.
 * @returns {Promise<mongoose.Document>} The saved refresh token document.
 *
 * @throws {Error} If the refresh token could not be saved to the database.
 */
function generateRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(40).toString('hex');

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const token = new RefreshToken({ token: refreshToken, userId, expiresAt });
  console.log("New Token: ", token);
  return token.save();
}

module.exports = generateRefreshToken;