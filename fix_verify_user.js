// Quick fix script to update verifyUser usage in API files
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'pages/api/volume.ts',
  'pages/api/refresh.ts',
  'pages/api/searchconsole.ts',
  'pages/api/insight.ts',
  'pages/api/keyword.ts',
  'pages/api/ideas.ts',
  'pages/api/cron.ts',
  'pages/api/dbmigrate.ts',
  'pages/api/domain.ts',
  'pages/api/adwords.ts',
  'pages/api/clearfailed.ts',
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old pattern with new pattern
  const oldPattern1 = /const authorized = verifyUser\(req, res\);[\s\S]*?if \(authorized !== 'authorized'\) \{[\s\S]*?return res\.status\(401\)\.json\({ error: authorized }\);/g;
  const newPattern1 = `const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });`;

  const oldPattern2 = /const authorized = verifyUser\(req, res\);[\s\S]*?if \(authorized !== 'authorized'\) \{[\s\S]*?return res\.status\(401\)\.json\(\{ error: .*? \}\);/g;

  if (content.match(oldPattern1) || content.match(oldPattern2)) {
    content = content.replace(oldPattern1, newPattern1);
    content = content.replace(oldPattern2, newPattern1);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  Skipped (no old pattern found): ${file}`);
  }
});

console.log('\n✅ All files processed!');
