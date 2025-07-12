-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sister_db;

-- Use the database
USE sister_db;

-- Create user if not exists (MySQL 8.0+ syntax)
CREATE USER IF NOT EXISTS 'k4'@'%' IDENTIFIED BY 'klpk4_sister';

-- Grant privileges
GRANT ALL PRIVILEGES ON sister_db.* TO 'k4'@'%';
FLUSH PRIVILEGES;

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price DECIMAL(10, 2) NOT NULL,
    qty INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO purchases (price, qty, total, user_id) VALUES 
(10.50, 2, 21.00, 'test-uuid-1'),
(25.00, 1, 25.00, 'test-uuid-2');

SELECT 'Database initialization completed successfully!' as message;