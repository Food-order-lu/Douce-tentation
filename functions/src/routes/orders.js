/**
 * Douce Tentation - Orders API Routes
 * ====================================
 * RESTful API endpoints for order management.
 * Uses abstracted DB service for persistence.
 * 
 * @module routes/orders
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');

// ========================================
// API Routes
// ========================================

/**
 * GET /api/orders
 * Retrieve all orders
 */
router.get('/', async (req, res) => {
    console.log('📡 GET /api/orders');
    try {
        const orders = await db.getOrders();
        res.json(orders);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
    console.log('📥 POST /api/orders');
    try {
        const newOrder = {
            id: Date.now(),
            ...req.body,
            source: req.body.source || 'manual'
        };
        await db.createOrder(newOrder);
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * PUT /api/orders/:id
 * Update an existing order
 */
router.put('/:id', async (req, res) => {
    console.log(`📝 PUT /api/orders/${req.params.id}`);
    try {
        const updated = await db.updateOrder(req.params.id, req.body);

        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * DELETE /api/orders/:id
 * Delete an order
 */
router.delete('/:id', async (req, res) => {
    console.log(`🗑️ DELETE /api/orders/${req.params.id}`);
    try {
        const success = await db.deleteOrder(req.params.id);

        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export router
module.exports = router;
