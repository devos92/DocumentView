/**
 * Refresh Token Schema
 *
 * This schema defines the structure for storing refresh tokens in the database.
 * Refresh tokens are used to generate new access tokens without requiring the user to log in again.
 *
 * Schema Fields:
 * - token: The actual refresh token string, which is securely generated and stored.
 * - userId: The ID of the user to whom this refresh token is associated. This field references the User schema.
 * - expiresAt: The expiration date and time for the refresh token. After this time, the token will be invalid.
 * - createdAt: The date and time when the refresh token was created. Defaults to the current time.
 *
 * Model Name:
 * - RefreshToken: The Mongoose model representing the refresh tokens collection in the database.
 *
 * Usage:
 * - This model is used to store and manage refresh tokens in an authentication system.
 * - When a user logs in, a new refresh token is generated and saved using this model.
 * - When a user requests a new access token using a refresh token, the system validates the token using this model.
 * - Expired or revoked tokens should be removed or flagged in the database.
 */

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    /**
     * @property {String} token - The refresh token string, used to uniquely identify the token.
     * @required This field is required to ensure each token is unique and valid.
     */
    token: {
        type: String,
        required: true
    },

    /**
     * @property {mongoose.Schema.Types.ObjectId} userId - Reference to the User schema.
     * This field associates the refresh token with a specific user in the database.
     * @required This field is required to ensure that the token can be linked back to a user.
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    /**
     * @property {Date} expiresAt - The expiration date and time for the refresh token.
     * This field determines when the refresh token should no longer be valid.
     * @required This field is required to enforce the expiration policy of refresh tokens.
     */
    expiresAt: {
        type: Date,
        required: true
    },

    /**
     * @property {Date} createdAt - The date and time when the refresh token was created.
     * This field defaults to the current date and time if not explicitly set.
     */
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
