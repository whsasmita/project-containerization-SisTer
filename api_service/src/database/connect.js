import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

// Debug: Log semua environment variables
console.log('=== DATABASE CONNECTION DEBUG ===');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***' : 'NOT SET');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('MYSQL_PORT:', process.env.MYSQL_PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('================================');

// Use environment variables from docker-compose
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'mysql_db',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'sister_db',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'k4',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'klpk4_sister',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    multipleStatements: false
};

console.log('Final DB Config:', {
    ...dbConfig,
    password: '***'
});

export const pool = mysql
    .createPool(dbConfig)
    .promise();

// Test koneksi dengan more detailed error handling
export async function testConnection() {
    try {
        console.log('Testing database connection...');
        const [rows] = await pool.execute('SELECT 1 as test');
        console.log('MySQL connection successful:', rows);
        return true;
    } catch (error) {
        console.error('MySQL connection failed with details:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Try to get more info about the connection attempt
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused - possible causes:');
            console.error('1. MySQL server is not running');
            console.error('2. Wrong host/port configuration');
            console.error('3. Network connectivity issues');
            console.error('4. Firewall blocking connection');
        }
        
        return false;
    }
}

// Test basic network connectivity
export async function testNetworkConnectivity() {
    const net = await import('net');
    
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const host = process.env.DB_HOST || 'mysql_db';
        const port = parseInt(process.env.DB_PORT || '3306');
        
        console.log(`Testing network connectivity to ${host}:${port}...`);
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
            console.log(`Network connection to ${host}:${port} successful!`);
            socket.destroy();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`Network connection to ${host}:${port} failed:`, error.message);
            resolve(false);
        });
        
        socket.on('timeout', () => {
            console.error(`Network connection to ${host}:${port} timed out`);
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}