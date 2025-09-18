import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";


export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Probar conexión
const testConnection = async () => {
    try {
        const [rows] = await pool.query('SELECT 1');
        console.log('Connected to MySQL');
    } catch (err) {
        console.error('Error connecting to MySQL:', err);
    }
};

testConnection();
