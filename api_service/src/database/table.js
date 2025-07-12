import { pool } from './connect.js';

async function createPurchasesTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            price DECIMAL(10, 2) NOT NULL,
            qty INT NOT NULL,
            total DECIMAL(10, 2) NOT NULL,
            user_id VARCHAR(36) NOT NULL, -- UUID V4 adalah 36 karakter
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        `;
        await pool.execute(query);
        console.log('Table "purchases" checked/created successfully!');
    } catch (error) {
        console.error('Error creating purchases table:', error);
        throw error;
    }
}

export { createPurchasesTable };