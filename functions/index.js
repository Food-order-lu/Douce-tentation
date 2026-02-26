const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const path = require("path");

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Set environment variable for DB service to use Firestore
process.env.USE_FIRESTORE = 'true';

// Import Routes
try {
    const ordersRouter = require("./src/routes/orders");
    app.use("/orders", ordersRouter);
} catch (e) {
    console.error("CRITICAL ERROR: Failed to load routes.", e);
    // Add default route to verify server is at least running
    app.get('*', (req, res) => res.status(500).json({
        error: 'Server initialization failed',
        details: e.message,
        stack: e.stack
    }));
}

// Export API (Gen 1 - Default Region)
exports.api = functions.https.onRequest(app);

