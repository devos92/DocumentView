/**
 * Function to call API
 *
 * This component is a configured instance of Axios used to make HTTP requests to the backend API.
 * It sets the base URL for the API depending on the environment and ensures that cookies are
 * included in requests by default so we can handle access tokens.
 *
 * @returns {AxiosInstance} - The configured Axios instance that can be used throughout the application 
 * to make HTTP requests to the backend API.
 *
 * EXAMPLE const response = await apiClient.get('api/your_route');
 */

import axios from 'axios';

// Configure the API base URL depending on the environment
const API_URL = process.env.API_URL || 'http://localhost:5000';

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Include cookies in requests for authentication
});

export const isAuthenticated = async () => {
    try {
        const response = await apiClient.get('api/users/check_token');
        return response.status === 200;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return false;
        }

        throw error;
    }
};

export default apiClient;
