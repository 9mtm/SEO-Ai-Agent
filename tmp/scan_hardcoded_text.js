const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['pages', 'components'];
const EXTENSIONS = ['.tsx', '.jsx', '.js', '.ts'];

// Regex to find potential hardcoded strings in JSX
// 1. Text between tags: >Text<
const tagTextRegex = />([^<{}\n\r\t]+)</g;
// 2. Attribute strings: label="Text", placeholder="Text", etc.
const attrTextRegex = /\s(label|placeholder|title|description|alt|caption)="([^"]+)"/g;

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const findings = [];

    // Skip certain files if needed
    if (filePath.includes('.test.') || filePath.includes('.spec.')) return [];

    lines.forEach((line, index) => {
        // Skip imports and comments
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) return;

        // Check for text between tags
        let match;
        while ((match = tagTextRegex.exec(line)) !== null) {
            const text = match[1].trim();
            // Basic filtering: must contain letters, not just symbols/numbers
            if (text && /[a-zA-Z\u0600-\u06FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
                // If the text is wrapped in quotes or contains only symbols, skip
                if (!/^["'{}]/.test(text)) {
                    findings.push({
                        line: index + 1,
                        text: text,
                        type: 'Tag Content'
                    });
                }
            }
        }
        tagTextRegex.lastIndex = 0; // reset

        // Check for hardcoded attributes
        while ((match = attrTextRegex.exec(line)) !== null) {
            const attr = match[1];
            const text = match[2].trim();
            // If it doesn't look like a variable and has content
            if (text && !text.includes('{{') && /[a-zA-Z\u0600-\u06FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
                findings.push({
                    line: index + 1,
                    text: `${attr}="${text}"`,
                    type: 'Attribute'
                });
            }
        }
        attrTextRegex.lastIndex = 0; // reset
    });

    return findings;
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (EXTENSIONS.includes(path.extname(dirPath))) {
                callback(dirPath);
            }
        }
    });
}

console.log('--- Scanning for hardcoded text (potentially missing translations) ---');
console.log('Directories:', DIRECTORIES.join(', '));
console.log('----------------------------------------------------------------------');

let totalFindings = 0;

DIRECTORIES.forEach(dir => {
    const absDir = path.resolve(process.cwd(), dir);
    if (fs.existsSync(absDir)) {
        walkDir(absDir, (filePath) => {
            const relativePath = path.relative(process.cwd(), filePath);
            const fileFindings = scanFile(absDir === filePath ? absDir : filePath);
            if (fileFindings.length > 0) {
                console.log(`\nFile: ${relativePath}`);
                fileFindings.forEach(f => {
                    console.log(`  [Line ${f.line}] (${f.type}): ${f.text}`);
                    totalFindings++;
                });
            }
        });
    }
});

console.log('\n----------------------------------------------------------------------');
console.log(`Scan completed. Total potential hardcoded strings found: ${totalFindings}`);
console.log('Note: Some findings might be technical terms, IDs, or false positives.');
