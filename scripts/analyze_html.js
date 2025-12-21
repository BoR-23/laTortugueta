const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.cwd(), 'local_page.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Find __NEXT_DATA__ (Pages Router)
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

if (match) {
    const jsonStr = match[1];
    console.log(`Total __NEXT_DATA__ JSON size: ${(jsonStr.length / 1024 / 1024).toFixed(2)} MB`);
} else {
    console.log('No __NEXT_DATA__ script found (expected for App Router).');
}

// Navigate to where products likely are. Usually props -> pageProps -> products (unlikely in App Router)
// In App Router, it's usually in `props -> unknown -> child props`? 
// No, App Router serialization is different. It uses self..__next_f.push(...) chunks.

// Let's check if it's Pages Router or App Router structure in the HTML.
// The file listing showed `app` directory, so it's App Router.
// App Router puts data in <script>self.__next_f.push(...)</script> streams.

// If it's App Router, we need to inspect all script tags with self.__next_f
const chunks = [];
const regex = /self\.__next_f\.push\(\[(.*?),(.*?)\]\)/g;
let m;

let totalScriptSize = 0;
while ((m = regex.exec(html)) !== null) {
    // m[2] is the stringified content
    try {
        const content = JSON.parse(m[2]);
        chunks.push(content);
        totalScriptSize += m[2].length;
    } catch (e) {
        console.log('Error parsing chunk');
    }
}

console.log(`Total App Router Data chunks size: ${(totalScriptSize / 1024 / 1024).toFixed(2)} MB`);

// Dump the chunks to a file to be inspected if needed, but for now let's just search for large strings
const allText = chunks.map(c => JSON.stringify(c)).join('');

// Search for repeated keys or large values
console.log('--- Analyzing large strings ---');
// Heuristic: finding strings > 1000 chars
const largeStrings = allText.match(/"([^"]{1000,})"/g);
if (largeStrings) {
    console.log(`Found ${largeStrings.length} large strings (>1000 chars).`);
    largeStrings.slice(0, 5).forEach(s => console.log(`Sample (len ${s.length}): ${s.substring(0, 50)}...`));
} else {
    console.log('No massive strings found.');
}

// Check for the products array structure if possible
// We look for known keys like "catalogProducts" or "prepareCatalogProducts" keys? No.
// We look for "id", "name", "price" patterns.

const productMarkers = (allText.match(/"price":/g) || []).length;
console.log(`Found "price" key occurrences: ${productMarkers}`);

const imageMarkers = (allText.match(/"image":/g) || []).length;
console.log(`Found "image" key occurrences: ${imageMarkers}`);

// Check specifically for layout.tsx data
// The user mentioned structured data.
const layoutDataMatch = html.match(/<script type="application\/ld\+json"(.*?)>(.*?)<\/script>/s);
if (layoutDataMatch) {
    console.log(`JSON-LD size: ${(layoutDataMatch[0].length / 1024).toFixed(2)} KB`);
}
