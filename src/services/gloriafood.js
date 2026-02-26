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
            return parseOrdersFromResponse(data);
        } else if (response.status === 204) {
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
 * Parse orders from response
 */
function parseOrdersFromResponse(data) {
    if (data.orders && Array.isArray(data.orders)) return data.orders;
    if (data.id) return [data];
    if (data.count > 0 && data.orders) return data.orders;
    return [];
}

/**
 * Extract options from an item
 */
function extractItemOptions(item) {
    if (!item.options || item.options.length === 0) return '';
    return item.options.map(opt => {
        const group = opt.group_name || '';
        // If the group name is generic or repetitive, just use name
        if (group.toLowerCase().includes('choix') || group.toLowerCase().includes('votre')) {
            return opt.name;
        }
        // Specific mapping for Finition to help the UI
        const lowGroup = group.toLowerCase();
        if (lowGroup.includes('finition') || lowGroup.includes('decoration') || lowGroup.includes('style')) {
            return `Finition: ${opt.name}`;
        }
        return `${group}: ${opt.name}`;
    }).join(' | ');
}

/**
 * Transform a GloriaFood order
 */
function transformOrder(gloriaOrder, source = ORDER_SOURCES.GLORIA_CAKE) {
    const processedItems = (gloriaOrder.items || []).map(item => {
        const itemOptions = extractItemOptions(item);
        const searchPool = (item.name + ' ' + itemOptions).toLowerCase();
        let catLabel = '';

        // keywords for salgados
        if (searchPool.includes('jambon') || searchPool.includes('fromage') ||
            searchPool.includes('poulet') || searchPool.includes('viande') ||
            searchPool.includes('salé') || searchPool.includes('salgado') ||
            searchPool.includes('rissóis') || searchPool.includes('rissois') ||
            searchPool.includes('coxinha') || searchPool.includes('alheira') ||
            searchPool.includes('croquette') || searchPool.includes('frit') ||
            searchPool.includes('francesinha') || searchPool.includes('bacalhau') ||
            searchPool.includes('morue') || searchPool.includes('bolinho') ||
            searchPool.includes('douzaine') || searchPool.includes('unite') ||
            searchPool.includes('unité') || searchPool.includes('beignet') ||
            searchPool.includes('accra') || searchPool.includes('croquette')) {
            catLabel = 'Catégorie: Salgados';
        }

        // Special case for Nutella/Curry which can be cake, but if it says "douzaine" it's a rissole
        if ((searchPool.includes('nutella') || searchPool.includes('curry')) &&
            (searchPool.includes('douzaine') || searchPool.includes('unite') || searchPool.includes('unité'))) {
            catLabel = 'Catégorie: Salgados';
        }

        return {
            ...item,
            instructions: catLabel ? `${catLabel} | ${itemOptions}` : itemOptions
        };
    });

    const autoSupplements = [];

    // Detailed search for personalized content
    gloriaOrder.items?.forEach(item => {
        let hasPersonalization = false;
        item.options?.forEach(opt => {
            const group = (opt.group_name || '').toLowerCase();
            const name = (opt.name || '').toLowerCase();

            // Check for personalization
            if (group.includes('plaque') || group.includes('inscription') ||
                name.includes('plaque') || name.includes('inscription') ||
                name.includes('personnalisée')) {
                hasPersonalization = true;
            }

            // Check for Finition (often in a group like 'Type de finition' or 'Style')
            if (group.includes('finition') || group.includes('votre choix') || group.includes('style')) {
                const finMsg = `Finition: ${opt.name}`;
                if (!autoSupplements.includes(finMsg)) autoSupplements.push(finMsg);
            }
        });

        if (hasPersonalization && gloriaOrder.instructions) {
            const msg = `Texte Plaque: ${gloriaOrder.instructions}`;
            if (!autoSupplements.includes(msg)) autoSupplements.push(msg);
        }
    });

    // If no plaque but there's an instruction, add it as a general note
    if (gloriaOrder.instructions && autoSupplements.length === 0) {
        autoSupplements.push(`Note: ${gloriaOrder.instructions}`);
    }

    return {
        id: String(gloriaOrder.id || Date.now()),
        type: extractOrderType(gloriaOrder),
        size: extractSize(gloriaOrder),
        client: `${gloriaOrder.client_first_name || 'Client'} ${gloriaOrder.client_last_name || ''}`.trim(),
        phone: gloriaOrder.client_phone || '',
        date: extractDate(gloriaOrder),
        time: extractTime(gloriaOrder),
        source: source,
        notes: gloriaOrder.instructions || '',
        items: processedItems,
        supplements: autoSupplements,
        status: (gloriaOrder.status === 'pending' || gloriaOrder.status === 'submitted') ? 'Pending' : 'Accepted',
        gloriaRaw: gloriaOrder
    };
}

function extractOrderType(order) {
    if (order.items && order.items.length > 0) {
        // Find most "significant" item or join first two
        if (order.items.length === 1) return order.items[0].name;
        return order.items.slice(0, 2).map(i => i.name).join(' + ') + (order.items.length > 2 ? '...' : '');
    }
    return 'Commande Web';
}

function extractSize(order) {
    if (order.items && order.items.length > 0) {
        const total = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        return `${total} article(s)`;
    }
    return '1 article';
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
