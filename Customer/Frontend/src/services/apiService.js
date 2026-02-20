import axios from 'axios';

const apiService = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5174',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add token to requests if needed in future
apiService.interceptors.request.use(
    (config) => {
        // You can add auth token logic here
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Unified response handling
apiService.interceptors.response.use(
    (response) => {
        // Return .data directly to match existing usage in Home.jsx (response.success check)
        return response.data;
    },
    (error) => {
        // Return a rejected promise with a standard format
        return Promise.reject(error.response?.data || error);
    }
);

export default apiService;
