/**
 * Douce Tentation - Database Service
 * ===================================
 * Abstracted database layer. 
 * Supports Firestore (production) and JSON File (fallback/dev).
 * 
 * @module services/db
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

// Constants
const COLLECTION_NAME = 'orders';
let admin;
let db;

// Singleton to init Firestore only once
function initFirestore() {
    if (!db) {
        try {
            // Check if firebase-admin is available (Cloud Functions environment)
            const firebaseAdmin = require('firebase-admin');

            // If already initialized by functions, use that app, else init
            if (firebaseAdmin.apps.length === 0) {
                firebaseAdmin.initializeApp();
            }
            db = firebaseAdmin.firestore();
            console.log('🔥 Firestore initialized');
        } catch (e) {
            console.warn('⚠️ Firestore not available (missing firebase-admin?):', e.message);
        }
    }
    return db;
}

// File-based fallback
const ORDERS_FILE = path.join(__dirname, '../../', config.ordersFile || 'orders.json');

function readFileKey() {
    try {
        if (!fs.existsSync(ORDERS_FILE)) return [];
        return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function saveFileKey(data) {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Save error:', e);
    }
}

// ========================================
// Public API
// ========================================

module.exports = {
    /**
     * Get all orders
     */
    async getOrders() {
        // Try Firestore first if allowed
        if (process.env.USE_FIRESTORE === 'true') {
            const firestore = initFirestore();
            if (firestore) {
                const snapshot = await firestore.collection(COLLECTION_NAME).get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        }

        // Fallback to file
        return readFileKey();
    },

    /**
     * Create a new order
     */
    async createOrder(order) {
        if (process.env.USE_FIRESTORE === 'true') {
            const firestore = initFirestore();
            if (firestore) {
                // Ensure ID is string
                const id = String(order.id);
                await firestore.collection(COLLECTION_NAME).doc(id).set(order);
                return order;
            }
        }

        // Fallback
        const orders = readFileKey();
        orders.push(order);
        saveFileKey(orders);
        return order;
    },

    /**
     * Update an order
     */
    async updateOrder(id, data) {
        if (process.env.USE_FIRESTORE === 'true') {
            const firestore = initFirestore();
            if (firestore) {
                await firestore.collection(COLLECTION_NAME).doc(String(id)).update(data);
                const doc = await firestore.collection(COLLECTION_NAME).doc(String(id)).get();
                return { id: doc.id, ...doc.data() };
            }
        }

        // Fallback
        const orders = readFileKey();
        const idx = orders.findIndex(o => o.id == id);
        if (idx !== -1) {
            orders[idx] = { ...orders[idx], ...data };
            saveFileKey(orders);
            return orders[idx];
        }
        return null;
    },

    /**
     * Delete an order
     */
    async deleteOrder(id) {
        if (process.env.USE_FIRESTORE === 'true') {
            const firestore = initFirestore();
            if (firestore) {
                await firestore.collection(COLLECTION_NAME).doc(String(id)).delete();
                return true;
            }
        }

        // Fallback
        let orders = readFileKey();
        const initLen = orders.length;
        orders = orders.filter(o => o.id != id);
        if (orders.length < initLen) {
            saveFileKey(orders);
            return true;
        }
        return false;
    }
};
