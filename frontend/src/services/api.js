// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export const getSubscribers = async () => {
    const response = await axios.get(`${API_URL}/subscribers`);
    return response.data;
};

export const addSubscriber = async (subscriberData) => {
    let payload;
    if (Array.isArray(subscriberData)) {
        // For bulk add, wrap the array as per your backend's expectation
        payload = { subscribers: subscriberData };
    } else {
        // For single add, send the object directly
        payload = subscriberData;
    }
    const response = await axios.post(`${API_URL}/subscribers`, payload);
    return response.data;
};

// Function for removing a single subscriber (as per your existing setup)
export const removeSubscriber = async (email) => {
    const response = await axios.delete(`${API_URL}/subscribers/`, { // Ensure trailing slash if in Flask route
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            email: email
        }
    });
    return response.data;
};

// Function for bulk removing subscribers
export const bulkRemoveSubscribers = async (subscribersList) => {
    // subscribersList should be an array of objects, e.g., [{email: "one@example.com"}, ...]
    const response = await axios.delete(`${API_URL}/subscribers/`, { // Ensure trailing slash
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            subscribers: subscribersList // Backend expects {"subscribers": [...]}
        }
    });
    return response.data;
};
