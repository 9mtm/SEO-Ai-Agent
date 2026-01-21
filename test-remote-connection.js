const { Sequelize } = require('sequelize');

// إعدادات الاتصال بـ TiDB Cloud
const sequelize = new Sequelize('test', '2RrT5s8JW33VmWZ.root', 'drlEpdD1PBwGoY58', {
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    dialect: 'mysql',
    port: 4000,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 20000 // مهلة 20 ثانية
    }
});

async function testConnection() {
    console.log('🔄 Connecting to TiDB Cloud...');
    try {
        await sequelize.authenticate();
        console.log('✅ SUCCESS! Connected to TiDB Cloud Database.');

        // فحص بسيط: هل يمكننا إنشاء جدول بسيط؟
        // await sequelize.query('CREATE TABLE IF NOT EXISTS test_connection (id INT)');
        // console.log('✅ Table creation check passed.');

    } catch (error) {
        console.error('❌ CONNECTION FAILED:', error.message);
        console.error('Details:', error.original ? error.original.code : error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
