/**
 * Douce Tentation - Configuration
 * ================================
 * Centralized configuration loaded from environment variables.
 * 
 * @module config
 */

require('dotenv').config();

const config = {
    // Server settings
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // GloriaFood API
    gloriaFood: {
        apiKey: process.env.GLORIAFOOD_API_KEY || '',
        apiUrl: 'https://pos.gloriafood.com/pos/order/pop',
        apiVersion: '2'
    },

    // Polling settings
    pollingInterval: parseInt(process.env.POLLING_INTERVAL, 10) || 60000,

    // File paths
    ordersFile: 'orders.json'
};

module.exports = config;
