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
const ordersRouter = require('./routes/orders');
const gloriaFoodService = require('./services/gloriafood');
const { readOrders, saveOrders } = require('./routes/orders');

// ========================================
// Express App Setup
// ========================================

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Also serve from root for backward compatibility
app.use(express.static(path.join(__dirname, '..')));

// ========================================
// API Routes
// ========================================

// Orders CRUD API
app.use('/api/orders', ordersRouter);

// GloriaFood Webhook (for future use)
app.post('/webhook/gloriafood', (req, res) => {
    console.log('📥 Webhook received');
    const data = req.body;
    const rawOrders = Array.isArray(data) ? data : [data];
    processIncomingOrders(rawOrders);
    res.json({ ok: true });
});

// ========================================
// GloriaFood Polling
// ========================================

/**
 * Process incoming orders from GloriaFood
 * Deduplicates and transforms orders before saving
 */
function processIncomingOrders(rawOrders) {
    const existingOrders = readOrders();
    let newCount = 0;

    rawOrders.forEach(rawOrder => {
        // Check if order already exists
        if (!existingOrders.find(o => o.id === rawOrder.id)) {
            const transformedOrder = gloriaFoodService.transformOrder(rawOrder);
            existingOrders.push(transformedOrder);
            newCount++;
        }
    });

    if (newCount > 0) {
        saveOrders(existingOrders);
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

// Start polling (with initial delay)
setInterval(pollGloriaFood, config.pollingInterval);
setTimeout(pollGloriaFood, 5000);

// ========================================
// Server Start
// ========================================

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
