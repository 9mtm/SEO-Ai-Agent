const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env.production') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});
 
async function check() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to:', process.env.DB_HOST);
        console.log('📂 Database:', process.env.DB_NAME);

        const [tables] = await sequelize.query("SHOW TABLES");
        console.log('\n📊 Tables found in Database:');
        console.table(tables);

        const [meta] = await sequelize.query("SELECT * FROM SequelizeMeta").catch(() => [[]]);
        console.log(`\n📝 SequelizeMeta records: ${meta.length}`);
        if (meta.length > 0) {
            console.log('First 5 records:', meta.slice(0, 5).map(m => m.name));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

check();
