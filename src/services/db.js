/**
 * Douce Tentation - Database Service
 * ===================================
 * Abstracted database layer. 
 * Supports Supabase (production) and JSON File (fallback/dev).
 * 
 * @module services/db
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { createClient } = require('@supabase/supabase-js');

// Supabase Init
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('🔗 Supabase client initialized');
}

// Constants
const TABLE_NAME = 'orders';
const ORDERS_FILE = path.join(__dirname, '../../', config.ordersFile || 'orders.json');

// File-based helpers
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
        if (process.env.DB_TYPE === 'supabase' && supabase) {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                console.error('❌ Supabase Fetch Error:', error);
                return readFileKey();
            }
            return data;
        }
        return readFileKey();
    },

    /**
     * Create a new order
     */
    async createOrder(order) {
        if (process.env.DB_TYPE === 'supabase' && supabase) {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .upsert([order], { onConflict: 'id' })
                .select();

            if (error) {
                console.error('❌ Supabase Insert Error:', error);
            } else {
                return data[0];
            }
        }

        // Fallback to local
        const orders = readFileKey();
        const existingIdx = orders.findIndex(o => String(o.id) === String(order.id));
        if (existingIdx !== -1) {
            orders[existingIdx] = { ...orders[existingIdx], ...order };
        } else {
            orders.push(order);
        }
        saveFileKey(orders);
        return order;
    },

    /**
     * Update an order
     */
    async updateOrder(id, updates) {
        if (process.env.DB_TYPE === 'supabase' && supabase) {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update({ ...updates, updated_at: new Date() })
                .eq('id', String(id))
                .select();

            if (error) {
                console.error('❌ Supabase Update Error:', error);
            } else if (data && data.length > 0) {
                return data[0];
            }
        }

        // Fallback
        const orders = readFileKey();
        const idx = orders.findIndex(o => o.id == id);
        if (idx !== -1) {
            orders[idx] = { ...orders[idx], ...updates };
            saveFileKey(orders);
            return orders[idx];
        }
        return null;
    },

    /**
     * Delete an order
     */
    async deleteOrder(id) {
        if (process.env.DB_TYPE === 'supabase' && supabase) {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('id', String(id));

            if (error) {
                console.error('❌ Supabase Delete Error:', error);
                return false;
            }
            return true;
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
