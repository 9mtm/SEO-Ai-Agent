// Generate a JWT session token for local testing.
// Run: node scripts/gen-token.js [userId]
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const jwt = require('jsonwebtoken');
const userId = Number(process.argv[2] || 1);
if (!process.env.SECRET) { console.error('SECRET missing from .env.local'); process.exit(1); }
console.log(jwt.sign({ userId }, process.env.SECRET, { expiresIn: '7d' }));
