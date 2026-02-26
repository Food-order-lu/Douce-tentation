/**
 * Douce Tentation - GloriaFood Service
 * =====================================
 * Handles all communication with the GloriaFood API.
 * 
 * @module services/gloriafood
 */

const fetch = require('node-fetch');
const config = require('../config');

/**
 * Order sources for visual distinction in calendar
 */
const ORDER_SOURCES = {
    GLORIA_CAKE: 'gloria_cake',
    GLORIA_SNACK: 'gloria_snack',
    MANUAL: 'manual'
};

/**
 * Poll GloriaFood API for new orders
 * @returns {Promise<Array>} Array of raw GloriaFood orders
 */
async function pollOrders() {
    if (!config.gloriaFood.apiKey) {
        console.warn('⚠️ GloriaFood API key not configured');
        return [];
    }

    try {
        const response = await fetch(config.gloriaFood.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': config.gloriaFood.apiKey,
                'Glf-Api-Version': config.gloriaFood.apiVersion,
                'Accept': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            console.log('📦 GloriaFood response:', JSON.stringify(data));
            return parseOrdersFromResponse(data);
        } else if (response.status === 204) {
            // No new orders - this is normal
            return [];
        } else {
            console.warn('⚠️ GloriaFood status:', response.status);
            return [];
        }
    } catch (error) {
        console.error('❌ GloriaFood polling error:', error.message);
        return [];
    }
}

/**
 * Parse orders from various GloriaFood response formats
 * @param {Object} data - Raw API response
 * @returns {Array} Normalized array of orders
 */
function parseOrdersFromResponse(data) {
    if (data.orders && Array.isArray(data.orders)) {
        return data.orders;
    } else if (data.id) {
        // Single order returned directly
        return [data];
    } else if (data.count > 0 && data.orders) {
        return data.orders;
    }
    return [];
}

/**
 * Transform a GloriaFood order to our internal format
 * @param {Object} gloriaOrder - Raw GloriaFood order
 * @param {string} source - Order source (gloria_cake or gloria_snack)
 * @returns {Object} Normalized order for our system
 */
function transformOrder(gloriaOrder, source = ORDER_SOURCES.GLORIA_CAKE) {
    return {
        id: gloriaOrder.id || Date.now() + Math.random(),
        type: extractOrderType(gloriaOrder),
        size: extractSize(gloriaOrder),
        client: `${gloriaOrder.client_first_name || 'Client'} ${gloriaOrder.client_last_name || ''}`.trim(),
        phone: gloriaOrder.client_phone || '',
        date: extractDate(gloriaOrder),
        time: extractTime(gloriaOrder),
        source: source,
        notes: gloriaOrder.instructions || '',
        supplements: [],
        status: 'Accepted',
        gloriaRaw: gloriaOrder
    };
}

// ========================================
// Helper Functions
// ========================================

function extractOrderType(order) {
    if (order.items && order.items.length > 0) {
        return order.items.map(item => item.name).join(', ');
    }
    return 'Commande Web';
}

function extractSize(order) {
    if (order.items && order.items.length > 0) {
        const total = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        return `${total} items`;
    }
    return 'Std';
}

function extractDate(order) {
    const dateStr = order.fulfill_at || order.accepted_at || new Date().toISOString();
    return dateStr.split('T')[0];
}

function extractTime(order) {
    const dateStr = order.fulfill_at || order.accepted_at || new Date().toISOString();
    if (dateStr.includes('T')) {
        return dateStr.split('T')[1].substring(0, 5);
    }
    return '12:00';
}

module.exports = {
    ORDER_SOURCES,
    pollOrders,
    transformOrder,
    parseOrdersFromResponse
};
