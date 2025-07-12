import express from 'express';
import { pool, testConnection, testNetworkConnectivity } from '../database/connect.js'; 
import { createPurchasesTable } from '../database/table.js';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Function untuk retry database connection
async function waitForDatabase(maxAttempts = 30, delayMs = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Attempting to connect to database... (${attempt}/${maxAttempts})`);
        
        // First test network connectivity
        const networkOk = await testNetworkConnectivity();
        if (!networkOk) {
            console.log('Network connectivity failed, retrying...');
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            continue;
        }
        
        // Then test database connection
        const isConnected = await testConnection();
        if (isConnected) {
            console.log('Database connection established successfully!');
            return true;
        }
        
        if (attempt < maxAttempts) {
            console.log(`Database connection failed, retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    console.error('Failed to connect to database after maximum attempts');
    return false;
}

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const isConnected = await testConnection();
        if (isConnected) {
            res.status(200).json({ status: 'healthy', database: 'connected' });
        } else {
            res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
        }
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

app.post('/api/purchase', async (req, res) => {
    try {
        const { price, qty } = req.body;

        if (typeof price !== 'number' || typeof qty !== 'number' || price <= 0 || qty <= 0) {
            return res.status(400).json({ error: 'Invalid input: price and qty must be positive numbers.' });
        }

        const total = price * qty;
        const userId = uuidv4();

        const purchaseData = {
            price,
            qty,
            total,
            user_id: userId,
            purchase_date: new Date()
        };

        const [result] = await pool.execute(
            'INSERT INTO purchases (price, qty, total, user_id, purchase_date) VALUES (?, ?, ?, ?, ?)',
            [purchaseData.price, purchaseData.qty, purchaseData.total, purchaseData.user_id, purchaseData.purchase_date]
        );

        console.log('Data saved to database:', result);

        res.status(201).json({
            price: purchaseData.price,
            qty: purchaseData.qty,
            total: purchaseData.total,
            user_id: purchaseData.user_id,
            id: result.insertId
        });

    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Get all purchases endpoint
app.get('/api/purchases', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM purchases ORDER BY purchase_date DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server dengan database connection check
async function startServer() {
    try {
        console.log('Starting API Service...');
        
        // Wait for database to be ready
        const dbReady = await waitForDatabase();
        if (!dbReady) {
            console.error('Cannot start server: Database is not available');
            process.exit(1);
        }
        
        // Create table if needed
        await createPurchasesTable();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`API Service running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Purchase endpoint: http://localhost:${PORT}/api/purchase (POST)`);
            console.log(`Get purchases: http://localhost:${PORT}/api/purchases (GET)`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();