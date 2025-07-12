const mongoose = require('mongoose');

/**
 * User Schema
 *
 * This schema defines the structure for user data in the application. Each user
 * has a unique username and email, a hashed password, a creation date, and a role.
 *
 * Fields:
 * - username: A unique identifier for the user. It must be between 3 and 255 characters.
 * - email: A unique email address for the user. It must be between 5 and 255 characters.
 * - password_hash: A hashed version of the user's password. It must be between 8 and 512 characters.
 * - created_at: The date and time when the user was created. Defaults to the current date and time.
 * - role: The role of the user in the application, either 'user' or 'admin'. Defaults to 'user'.
 *
 * Constraints:
 * - username and emai are both required and must be unique.
 * - password_hash is required and should meet the constraints.
 * - role is required and currently can only be either user or admin.
 *
 * Indexes:
 * - `username` and `email` fields are indexed to enforce uniqueness.
 */

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 255,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 255,
    },
    password_hash: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 512,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
