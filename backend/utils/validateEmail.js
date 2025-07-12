
/**
 * Validate the format of the user's email.
 *
 * This function checks if the provided email matches the expected email pattern.
 *
 * @param {string} email - The email to validate.
 * @throws Will throw an error if the email format is invalid.
 */
function validateEmail(email) {
  const emailChars = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailChars.test(email)) {
    throw new Error('Invalid email');
  }
}

module.exports = validateEmail;
