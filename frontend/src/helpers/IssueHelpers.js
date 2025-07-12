const seedrandom = require('seedrandom');

/**
 * Generate a "nice" reference ID in the format of "ABC-1234"
 * @param {Object} data - The data object to generate the reference ID from
 * @returns {String} - The generated reference ID
 * @example
 * const data = { _id: '5f3f8d3b4f2d8b1f4c3f8d3b' };
 * const niceReferenceId = generateNiceReferenceId(data);
 * console.log(niceReferenceId); // "ABC-1234"
 */
export function generateNiceReferenceId(data) {
    // use seeded rng to get three random letters, then four random numbers
    let id = data._id || data;
    const rng = seedrandom(id);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const randomLetter = () => letters[Math.floor(rng() * letters.length)];
    const randomNumber = () => numbers[Math.floor(rng() * numbers.length)];
    const niceReferenceId = `${randomLetter()}${randomLetter()}${randomLetter()}-${randomNumber()}${randomNumber()}${randomNumber()}${randomNumber()}`;
    return niceReferenceId;
}

export const charmOptions = [
    '⚠️', '🚀', '🐞', '💻', '📅', '🌐', '🏆', '🏠', '🐈', '🐕', '⏱️', '🎵',
    '⭐', '🔎', '📸', '💾', '❤️', '🎬', '📖', '🎂', '🖥️', '🔥', '🎫', '🔧',
    '🚫', '💥', '🎓', '📚'
];

/**
 * Returns a CSS class based on the issue's latest status, allowing for dynamic
 * background and text colours that indicate the status (e.g., Complete, In Progress).
 */
export const getStatusClass = (status) => {
    const baseClass = 'whitespace-nowrap px-3 py-1 rounded-full text-sm font-semibold'; // Prevents wrapping
    switch (status) {
        case 1:
            return `${baseClass} bg-green-500 text-white`; // Complete status
        case 2:
            return `${baseClass} bg-yellow-500 text-white`; // In Progress status
        case 3:
            return `${baseClass} bg-red-500 text-white`; // Cancelled status
        case 4:
            return `${baseClass} bg-gray-500 text-white`; // Pending status
        default:
            return `${baseClass} bg-gray-500 text-white`; // Fallback for unknown statuses
    }
};

/**
 * Converts the status ID into a human-readable text label for display.
 */
export const getStatusText = (status) => {
    switch (status) {
        case 1:
            return 'Complete';
        case 2:
            return 'In Progress';
        case 3:
            return 'Cancelled';
        case 4:
            return 'Pending';
        default:
            return 'Unknown';
    }
};