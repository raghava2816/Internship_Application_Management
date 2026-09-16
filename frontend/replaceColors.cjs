const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = {
    'emerald': 'orange',
    'cyan': 'rose',
    'teal': 'amber',
    '#10B981': '#F97316',
    '#6EE7B7': '#FB923C',
    '#22D3EE': '#F43F5E',
    '#059669': '#EA580C',
    '#34D399': '#FDBA74',
    '#06B6D4': '#FB7185'
};

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walkDir(srcDir);
files.push(path.join(__dirname, 'index.html'));

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    for (const [key, value] of Object.entries(replacements)) {
        // use regex to match whole words for emerald, cyan, teal to avoid partial matches
        if (['emerald', 'cyan', 'teal'].includes(key)) {
            const regex = new RegExp(key, 'g');
            content = content.replace(regex, value);
        } else {
            // direct string replacement for hex colors, replace all occurrences
            content = content.split(key).join(value);
        }
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        changedCount++;
    }
});

console.log(`Updated ${changedCount} files.`);
