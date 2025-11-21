
const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '../products_rows.csv');
const categoriesPath = path.join(__dirname, '../categories_rows.csv');

function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        // Simple CSV parser (doesn't handle commas in quotes correctly for all cases but enough for this debug)
        // Actually, let's just look for the line with "3-fonts"
        return line;
    });
}

const productsContent = fs.readFileSync(productsPath, 'utf8');
const categoriesContent = fs.readFileSync(categoriesPath, 'utf8');

console.log('--- Categories (De Hombre) ---');
const catLine = categoriesContent.split('\n').find(l => l.includes('De Hombre'));
console.log(catLine);

console.log('--- Product (3-fonts) ---');
const prodLine = productsContent.split('\n').find(l => l.startsWith('3-fonts'));
console.log(prodLine);

// Extract tags from product line
// CSV format: id,name,...,tags,...
// tags is the 11th column (index 10) if we split by comma, but tags has commas inside quotes.
// Let's use a regex to extract the JSON array.
const tagsMatch = prodLine.match(/"\[(.*?)\]"/);
if (tagsMatch) {
    const tagsJson = `[${tagsMatch[1].replace(/""/g, '"')}]`;
    console.log('Parsed Tags JSON:', tagsJson);
    try {
        const tags = JSON.parse(tagsJson);
        console.log('Tags Array:', tags);

        const filterTag = "De Home"; // From category
        const normalizedFilter = filterTag.toLowerCase().trim();

        const matches = tags.some(t => t.toLowerCase().trim() === normalizedFilter);
        console.log(`Matches '${filterTag}'?`, matches);
    } catch (e) {
        console.error('Error parsing tags:', e);
    }
} else {
    console.log('Could not extract tags');
}
