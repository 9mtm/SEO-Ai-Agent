require('dotenv').config({ path: '.env.local' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'serpbear',
    logging: false,
});

async function resetFlags() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const [results] = await sequelize.query(`
      UPDATE keyword 
      SET updating_competitors = 0 
      WHERE updating_competitors = 1
    `);

        console.log(`✅ Reset ${results.affectedRows || 0} keywords`);
        console.log('✅ Done! Reload the page now.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetFlags();
