import { pool } from './connect.js';

async function createPurchasesTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            price INT NOT NULL,
            qty INT NOT NULL,
            total INT NOT NULL,
            user_id VARCHAR(36) NOT NULL,
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