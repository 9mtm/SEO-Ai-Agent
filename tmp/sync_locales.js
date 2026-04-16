const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'locales');
const enPath = path.join(localesDir, 'en', 'common.json');

function syncObjects(source, target) {
    let updated = false;
    for (const key in source) {
        if (!(key in target)) {
            target[key] = source[key];
            updated = true;
        } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (syncObjects(source[key], target[key])) {
                updated = true;
            }
        }
    }
    return updated;
}

try {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const targetLocales = fs.readdirSync(localesDir).filter(f => f !== 'en' && fs.lstatSync(path.join(localesDir, f)).isDirectory());

    targetLocales.forEach(lang => {
        const langPath = path.join(localesDir, lang, 'common.json');
        if (!fs.existsSync(langPath)) return;

        let langData;
        try {
            langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        } catch (e) {
            console.error(`Error parsing ${lang}: ${e.message}`);
            return;
        }

        if (syncObjects(en, langData)) {
            fs.writeFileSync(langPath, JSON.stringify(langData, null, 2), 'utf8');
            console.log(`✅ Synced ${lang}`);
        } else {
            console.log(`⚪ ${lang} already in sync`);
        }
    });

} catch (err) {
    console.error('Audit Error:', err.message);
}
