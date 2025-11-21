const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

const csvPath = path.join(__dirname, '..', 'products_rows.csv');

function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
}

async function syncPrices() {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    // Skip header
    const dataLines = lines.slice(1).filter(l => l.trim());

    console.log(`Found ${dataLines.length} products in CSV. Updating prices...`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const line of dataLines) {
        try {
            const columns = parseCSVLine(line);
            const id = columns[0];
            // Price is 4th column (index 3) based on header: id,name,description,price,...
            const priceStr = columns[3];
            const price = parseFloat(priceStr);

            if (!id || isNaN(price)) continue;

            if (price > 0) {
                const { error } = await supabase
                    .from('products')
                    .update({ price: price, available: true }) // Also set available to true if price > 0
                    .eq('id', id);

                if (error) {
                    console.error(`Error updating ${id}:`, error.message);
                    errorCount++;
                } else {
                    // console.log(`Updated ${id} -> ${price}€`);
                    updatedCount++;
                }
            }
        } catch (e) {
            console.error('Error parsing line:', e);
            errorCount++;
        }
    }

    console.log(`Finished. Updated: ${updatedCount}, Errors: ${errorCount}`);
}

syncPrices().catch(console.error);
