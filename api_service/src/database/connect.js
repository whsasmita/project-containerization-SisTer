import mysql from "mysql2";
import { Kafka } from 'kafkajs';
import net from 'net'; 

// --- Konfigurasi MySQL ---
// Langsung gunakan process.env, karena dotenv.config() akan dipanggil di app.js
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
    multipleStatements: false
};

// Buat pool koneksi MySQL
export const pool = mysql
    .createPool(dbConfig)
    .promise();

// --- Konfigurasi Kafka/Redpanda ---
export const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'api_service_klpk4',
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

// Buat dan ekspor Kafka Producer
export const producer = kafka.producer();

// --- Fungsi untuk Test Koneksi Database (MySQL) ---
export async function testConnection() {
    try {
        console.log('Testing database connection...');
        const connection = await pool.getConnection(); // Coba ambil koneksi dari pool
        connection.release(); // Segera lepaskan koneksi
        console.log('MySQL connection successful!');
        return true;
    } catch (error) {
        console.error('MySQL connection test failed with details:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Possible causes: MySQL server not running, wrong host/port, or network issues.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied - check MySQL username and password.');
        }
        return false;
    }
}

// --- Fungsi untuk Test Konektivitas Jaringan (Basic) ---
export async function testNetworkConnectivity() {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        // Pastikan host dan port terbaca dari process.env setelah dotenv.config() dijalankan di app.js
        const host = process.env.DB_HOST || process.env.MYSQL_HOST || 'mysql_db';
        const port = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306');
        
        console.log(`Testing network connectivity to ${host}:${port}...`);
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
            console.log(`Network connection to ${host}:${port} successful!`);
            socket.destroy();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`Network connection to ${host}:${port} failed:`, error.message);
            socket.destroy();
            resolve(false);
        });
        
        socket.on('timeout', () => {
            console.error(`Network connection to ${host}:${port} timed out.`);
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}