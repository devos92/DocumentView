/**
 * Gets a URL to the user's profile picture
 * @param {string} id - The user's ID
 * @param {number} size - The size of the profile picture
 */
export function GetUserAvatar(id, size = 200) {
    return `https://i.pravatar.cc/${size}?u=${id}`;
}
