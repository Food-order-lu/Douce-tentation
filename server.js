/**
 * Douce Tentation - Serveur Backend
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8000;

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const GLORIA_KEY = 'RDqEyu44GivvaqbGXY';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readOrders() {
    try {
        if (!fs.existsSync(ORDERS_FILE)) return [];
        const data = fs.readFileSync(ORDERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error('Erreur lecture orders.json:', e);
        return [];
    }
}

function saveOrders(orders) {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    } catch (e) {
        console.error('Erreur écriture orders.json:', e);
    }
}

async function pollGloriaOrders() {
    console.log('🔄 Polling GloriaFood...');
    if (!GLORIA_KEY) return;
    try {
        const response = await fetch('https://pos.gloriafood.com/pos/order/pop', {
            method: 'POST',
            headers: {
                'Authorization': GLORIA_KEY,
                'Glf-Api-Version': '2',
                'Accept': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            console.log('📦 Reçu de GloriaFood:', JSON.stringify(data));

            let ordersToProcess = [];
            if (data.orders && Array.isArray(data.orders)) {
                ordersToProcess = data.orders;
            } else if (data.id) {
                ordersToProcess = [data]; // C'est peut-être une seule commande directe
            } else if (data.count > 0 && data.orders) {
                ordersToProcess = data.orders;
            }

            if (ordersToProcess.length > 0) {
                processIncomingOrders(ordersToProcess);
            }
        } else if (response.status !== 204) {
            console.log('⚠️ Status GloriaFood:', response.status);
        }
    } catch (error) {
        console.error('❌ Erreur polling GloriaFood:', error.message);
    }
}

function processIncomingOrders(incoming) {
    const orders = readOrders();
    let count = 0;
    incoming.forEach(gOrder => {
        if (!orders.find(o => o.id === gOrder.id)) {
            const newOrder = {
                id: gOrder.id || Date.now() + Math.random(),
                type: extractOrderType(gOrder),
                size: extractSize(gOrder),
                client: (gOrder.client_first_name || 'Client') + ' ' + (gOrder.client_last_name || ''),
                phone: gOrder.client_phone || '',
                date: extractDate(gOrder),
                time: extractTime(gOrder),
                source: 'gloria_cake',
                notes: gOrder.instructions || '',
                supplements: [],
                status: 'Accepted',
                gloriaRaw: gOrder
            };
            orders.push(newOrder);
            count++;
        }
    });
    if (count > 0) {
        saveOrders(orders);
        console.log(`✅ ${count} commandes importées.`);
    }
}

// Helpers extraction
function extractOrderType(o) {
    if (o.items && o.items.length > 0) return o.items.map(i => i.name).join(', ');
    return 'Commande Web';
}
function extractSize(o) {
    if (o.items && o.items.length > 0) return o.items.reduce((s, i) => s + (i.quantity || 1), 0) + ' items';
    return 'Std';
}
function extractDate(o) {
    const d = o.fulfill_at || o.accepted_at || new Date().toISOString();
    return d.split('T')[0];
}
function extractTime(o) {
    const d = o.fulfill_at || o.accepted_at || new Date().toISOString();
    return d.includes('T') ? d.split('T')[1].substring(0, 5) : '12:00';
}

// API
app.get('/api/orders', (req, res) => {
    console.log('📡 Envoi des commandes au client...');
    res.json(readOrders());
});

app.post('/api/orders', (req, res) => {
    const orders = readOrders();
    const newOrder = { id: Date.now(), ...req.body, source: 'manual' };
    orders.push(newOrder);
    saveOrders(orders);
    res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
    const orders = readOrders();
    const idx = orders.findIndex(o => o.id == req.params.id);
    if (idx !== -1) {
        orders[idx] = { ...orders[idx], ...req.body };
        saveOrders(orders);
        res.json(orders[idx]);
    } else res.status(404).json({ error: 'Not found' });
});

app.delete('/api/orders/:id', (req, res) => {
    let orders = readOrders();
    orders = orders.filter(o => o.id != req.params.id);
    saveOrders(orders);
    res.json({ success: true });
});

app.get('/api/orders/backup/download', (req, res) => {
    console.log('📥 Download Backup requested (Legacy Server)');
    try {
        const orders = readOrders();
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

app.post('/webhook/gloriafood', (req, res) => {
    console.log('📥 Webhook reçu');
    const data = req.body;
    processIncomingOrders(Array.isArray(data) ? data : [data]);
    res.json({ ok: true });
});

setInterval(pollGloriaOrders, 60000);
setTimeout(pollGloriaOrders, 5000);

app.listen(PORT, () => console.log(`🚀 Serveur sur port ${PORT}`));
