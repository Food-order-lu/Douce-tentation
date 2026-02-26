/**
 * Douce Tentation - Backend Server
 * =================================
 * Express server with GloriaFood integration for the production calendar.
 * 
 * Architecture:
 * - /src/config/       - Configuration (environment variables)
 * - /src/routes/       - API route handlers
 * - /src/services/     - External service integrations
 * 
 * @author Douce Tentation Team
 * @version 2.0.0
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import modules
const config = require('./config');
const db = require('./services/db');
const ordersRouter = require('./routes/orders');
const gloriaFoodService = require('./services/gloriafood');


// ========================================
// Express App Setup
// ========================================

const app = express();

// Simple Request Logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files ONLY from public folder
app.use(express.static(path.join(__dirname, '../public')));


// ========================================
// API Routes
// ========================================

// Orders CRUD API
app.use('/api/orders', ordersRouter);

// GloriaFood Webhook (for future use)
app.post('/webhook/gloriafood', async (req, res) => {
    console.log('📥 Webhook received');
    const data = req.body;
    const rawOrders = Array.isArray(data) ? data : [data];
    await processIncomingOrders(rawOrders);
    res.json({ ok: true });
});

// ========================================
// GloriaFood Polling
// ========================================

/**
 * Process incoming orders from GloriaFood
 * Deduplicates and transforms orders before saving
 */
async function processIncomingOrders(rawOrders) {
    let newCount = 0;

    // Get existing orders to check for duplicates
    const currentOrders = await db.getOrders();
    const existingIds = new Set(currentOrders.map(o => String(o.id)));

    for (const gOrder of rawOrders) {
        const orderId = String(gOrder.id);
        // Check if order already exists (by ID)
        if (!existingIds.has(orderId)) {
            const newOrder = gloriaFoodService.transformOrder(gOrder);
            await db.createOrder(newOrder);
            existingIds.add(orderId);
            newCount++;
        }
    }

    if (newCount > 0) {
        console.log(`✅ ${newCount} new order(s) imported`);
    }
}


/**
 * Poll GloriaFood for new orders
 */
async function pollGloriaFood() {
    console.log('🔄 Polling GloriaFood...');
    const rawOrders = await gloriaFoodService.pollOrders();
    if (rawOrders.length > 0) {
        processIncomingOrders(rawOrders);
    }
}

// Start polling (with initial delay) - Only if NOT in serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    setInterval(pollGloriaFood, config.pollingInterval);
    setTimeout(pollGloriaFood, 5000);
}

// ========================================
// Server Start
// ========================================

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`
╔════════════════════════════════════════╗
║     🍰 Douce Tentation Server 🍰       ║
╠════════════════════════════════════════╣
║  Port: ${config.port}                            ║
║  Mode: ${config.nodeEnv.padEnd(26)}║
║  GloriaFood: ${config.gloriaFood.apiKey ? 'Connected ✓' : 'Not configured'}          ║
╚════════════════════════════════════════╝
        `);
    });
}

// Export for Vercel
module.exports = app;
