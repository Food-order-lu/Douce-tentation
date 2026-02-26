const API_BASE = '/api/orders';

/**
 * Fetch all orders from Local API (fallback to Firestore if needed)
 * @returns {Promise<Array>} Array of orders
 */
async function fetchOrders() {
    console.log('🌐 Fetching orders from Local API...');
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error('API request failed');
        const orders = await response.json();
        console.log(`✅ Loaded ${orders.length} orders from API`);
        return orders;
    } catch (apiError) {
        console.error('❌ Local API fetch failed:', apiError);
        return [];
    }
}


/**
 * Create a new order via Local API
 */
async function createOrder(orderData) {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return await response.json();
    } catch (error) {
        console.error('❌ Create order local error:', error);
        // Fallback to Firestore
        const db = firebase.firestore();
        const docRef = await db.collection('orders').add(orderData);
        return { id: docRef.id, ...orderData };
    }
}

/**
 * Update an existing order
 */
async function updateOrder(id, orderData) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return await response.json();
    } catch (error) {
        console.error('❌ Update order local error:', error);
        return null;
    }
}

/**
 * Delete an order
 */
async function deleteOrder(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('❌ Delete order local error:', error);
        return false;
    }
}

/**
 * Trigger remote sync via local API
 */
async function syncOrders() {
    try {
        const response = await fetch('/api/orders/sync', { method: 'POST' });
        return await response.json();
    } catch (error) {
        console.error('❌ Sync error:', error);
        return { success: false };
    }
}

// Export
window.DouxAPI = {
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    syncOrders
};

