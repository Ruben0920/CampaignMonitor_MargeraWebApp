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
        payload = { subscribers: subscriberData };
    } else {
        payload = subscriberData;
    }
    const response = await axios.post(`${API_URL}/subscribers`, payload);
    return response.data;
};

export const removeSubscriber = async (email) => {
    const response = await axios.delete(`${API_URL}/subscribers/`, { 
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            email: email
        }
    });
    return response.data;
};

export const bulkRemoveSubscribers = async (subscribersList) => {
    const response = await axios.delete(`${API_URL}/subscribers/`, { 
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            subscribers: subscribersList 
        }
    });
    return response.data;
};
