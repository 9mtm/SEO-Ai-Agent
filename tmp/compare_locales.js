const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'locales');
const enPath = path.join(localesDir, 'en', 'common.json');

function getKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((res, el) => {
        if (Array.isArray(obj[el])) {
            return res;
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []);
}

try {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const enKeys = getKeys(en);
    
    const targetLocales = fs.readdirSync(localesDir).filter(f => f !== 'en' && fs.lstatSync(path.join(localesDir, f)).isDirectory());

    console.log(`\n--- Global Parity Audit ---`);
    console.log(`Source Language: English (${enKeys.length} keys)`);
    console.log(`Checking locales: ${targetLocales.join(', ')}`);

    targetLocales.forEach(lang => {
        const langPath = path.join(localesDir, lang, 'common.json');
        if (!fs.existsSync(langPath)) {
            console.log(`\n⚠️  ${lang.toUpperCase()}: common.json NOT FOUND`);
            return;
        }

        const currentLang = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        const currentKeys = getKeys(currentLang);
        const missingKeys = enKeys.filter(key => !currentKeys.includes(key));

        if (missingKeys.length > 0) {
            console.log(`\n❌ ${lang.toUpperCase()} (${currentKeys.length}/${enKeys.length} keys) - Missing ${missingKeys.length} keys:`);
            // Only show first 10 missing keys to keep output readable
            missingKeys.slice(0, 10).forEach(k => console.log(`  - ${k}`));
            if (missingKeys.length > 10) console.log(`  ... and ${missingKeys.length - 10} more.`);
        } else {
            console.log(`✅ ${lang.toUpperCase()} is 100% complete.`);
        }
    });

} catch (err) {
    console.error('Audit Error:', err.message);
}
