const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'locales', 'en', 'common.json');
const jaPath = path.join(__dirname, '..', 'locales', 'ja', 'common.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const enKeys = getKeys(en);
const jaKeys = getKeys(ja);

const missingInJa = enKeys.filter(key => !jaKeys.includes(key));
const extraInJa = jaKeys.filter(key => !enKeys.includes(key));

console.log('--- Missing in Japanese ---');
if (missingInJa.length === 0) console.log('None');
else missingInJa.forEach(key => console.log(key));

console.log('\n--- Extra in Japanese (not in English) ---');
if (extraInJa.length === 0) console.log('None');
else extraInJa.forEach(key => console.log(key));
