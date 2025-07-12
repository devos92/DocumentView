/**
 * Validate the strength of the user's password.
 *
 * This function checks if the provided password meets specific criteria:
 * - At least 8 characters long
 * - Contains at least 1 uppercase letter
 * - Contains at least 1 special character
 * - Contains at least 1 number
 * - Does not contain any spaces
 *
 * @param {string} password - The password to validate.
 * @throws Will throw an error if the password does not meet the criteria.
 */
function validatePassword(password) {
    const minLength = 8;
    const minUppercase = 1;
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    const uppercaseChars = /[A-Z]/;
    const numberChars = /[0-9]/;
    const spaces = /\s/;

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters`);
    }
    if (!specialChars.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    if (!uppercaseChars.test(password)) {
      throw new Error(
        `Password must contain at least ${minUppercase} uppercase character`
      );
    }
    if (!numberChars.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (spaces.test(password)) {
      throw new Error('Password cannot contain spaces');
    }
  }

module.exports = validatePassword;