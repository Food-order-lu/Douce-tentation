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

const gloriaFoodService = require('../services/gloriafood');

/**
 * GET /api/orders/backup/download
 * Download all orders as a JSON file
 */
router.get('/backup/download', async (req, res) => {
    console.log('📥 Download Backup requested');
    try {
        const orders = await db.getOrders();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `douce_tentation_backup_${timestamp}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(JSON.stringify(orders, null, 2));
    } catch (error) {
        console.error('Download Error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

/**
 * GET/POST /api/orders/sync
 * Manually trigger a sync with GloriaFood
 */
router.all('/sync', async (req, res) => {
    console.log('🔄 Manual Sync triggered');
    try {
        const rawOrders = await gloriaFoodService.pollOrders();

        let newCount = 0;
        if (rawOrders && rawOrders.length > 0) {
            const currentOrders = await db.getOrders();
            const existingIds = new Set(currentOrders.map(o => String(o.id)));

            for (const gOrder of rawOrders) {
                const orderId = String(gOrder.id);
                if (!existingIds.has(orderId)) {
                    const newOrder = gloriaFoodService.transformOrder(gOrder);
                    await db.createOrder(newOrder);
                    existingIds.add(orderId);
                    newCount++;
                }
            }
        }

        res.json({
            success: true,
            message: `Sync complete. ${newCount} new orders.`,
            newOrdersCount: newCount
        });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Sync failed: ' + error.message });
    }
});

/**
 * POST /api/orders/backup
 * Trigger a backup of all orders
 */
router.post('/backup', async (req, res) => {
    console.log('💾 Backup triggered');
    try {
        const result = await db.takeBackup();
        res.json({ success: true, result });
    } catch (error) {
        console.error('Backup Error:', error);
        res.status(500).json({ error: 'Backup failed: ' + error.message });
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
