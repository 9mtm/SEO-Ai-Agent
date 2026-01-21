const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.production' });

async function testVPSConnection() {
    console.log('🔍 Testing VPS MySQL Connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('---');

    try {
        const connectionConfig = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 10000
        };

        // Add SSL if connecting to TiDB Cloud
        if (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud')) {
            connectionConfig.ssl = {
                rejectUnauthorized: false
            };
            console.log('🔒 SSL enabled for TiDB Cloud');
        }

        const connection = await mysql.createConnection(connectionConfig);

        console.log('✅ Connection successful!');

        // Test query
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('✅ Query test successful:', rows);

        // Show databases
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('✅ Available databases:', databases.map(db => db.Database));

        await connection.end();
        console.log('✅ Connection closed successfully');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Error errno:', error.errno);

        if (error.code === 'ENOTFOUND') {
            console.error('💡 Hostname not found. Check DB_HOST in .env.production');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused. Check if MySQL is running and port is correct');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied. Check DB_USER and DB_PASSWORD');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Database does not exist. Check DB_NAME');
        }
    }
}

testVPSConnection();
