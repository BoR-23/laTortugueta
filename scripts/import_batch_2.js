const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const csvPath = path.join(__dirname, 'sales_batch_2.csv');

function parseCSVLine(text) {
    const result = []
    let start = 0
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') { inQuotes = !inQuotes }
        else if (text[i] === ',' && !inQuotes) {
            result.push(text.substring(start, i).replace(/^"|"$/g, '').trim())
            start = i + 1
        }
    }
    result.push(text.substring(start).replace(/^"|"$/g, '').trim())
    return result
}

async function importSales() {
    console.log('Importing Batch 2 (Rosa Tomas)...');

    if (!fs.existsSync(csvPath)) {
        console.error('CSV not found');
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    // Fetch products for matching
    const { data: products } = await supabase.from('products').select('id, name');

    // Clean up potential duplicates for this order ID if needed, but safe to assume it's new data.
    // However, if we run this multiple times, it will duplicate. Let's delete 1854 first.
    await supabase.from('sales').delete().eq('order_id', '1854');

    const records = [];
    const startIndex = 1; // Skip header

    for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);

        let rawOrderId = cols[0]; // "1854 M"
        let dateStr = cols[1];
        let clientName = cols[2];
        let details = cols[3];
        let deliveryRaw = cols[4];

        // Parse 'M' suffix
        let isWholesale = false;
        let cleanOrderId = rawOrderId;
        if (rawOrderId.toUpperCase().includes(' M')) {
            isWholesale = true;
            cleanOrderId = rawOrderId.replace(/ M/i, '').trim();
        }

        // Parse Model/Size from details
        // Details examples: "Taronger T/35 - ..."
        const sizeMatch = details.match(/T\/(\d+(?:[.,]\d+)?)/i);
        const size = sizeMatch ? sizeMatch[1] : '';

        // Extract product name
        let productName = details;
        if (details.includes(' T/')) {
            productName = details.split(' T/')[0].trim();
        } else if (details.includes(' - ')) {
            productName = details.split(' - ')[0].trim();
        }

        // Match Product ID
        let productId = null;
        if (productName && products) {
            const exact = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
            if (exact) productId = exact.id;
            else {
                const partial = products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
                if (partial) productId = partial.id;
            }
        }

        // Date Parsing
        let date = null;
        if (dateStr) {
            const [d, m, y] = dateStr.split('/');
            if (d && m && y) date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Delivery Date Cleanup (.10//01 -> 10/01)
        if (deliveryRaw) {
            deliveryRaw = deliveryRaw.replace(/\/\//g, '/').replace(/^\./, '');
        }

        records.push({
            order_id: cleanOrderId,
            date: date,
            client: clientName,
            product_name: productName,
            size: size,
            details: details,
            delivery_date: deliveryRaw,
            status: 'pending',
            product_id: productId,
            is_wholesale: isWholesale
        });
    }

    console.log(`Inserting ${records.length} records...`);
    const { error } = await supabase.from('sales').insert(records);
    if (error) console.error('Error:', error);
    else console.log('Success.');
}

importSales();
