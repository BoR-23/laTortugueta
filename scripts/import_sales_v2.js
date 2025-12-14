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

const csvPath = path.join(__dirname, 'sales_data_temp.csv');

function parseCSVLine(text) {
    const result = []
    let start = 0
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes
        } else if (text[i] === ',' && !inQuotes) {
            result.push(text.substring(start, i).replace(/^"|"$/g, '').trim())
            start = i + 1
        }
    }
    result.push(text.substring(start).replace(/^"|"$/g, '').trim())
    return result
}

async function importSales() {
    console.log('Starting sales import (v2 - Wholesale)...');

    // 1. DELETE PREVIOUS BATCH to avoid duplicates
    // We can identify them by order_id range 1845-1853 or just date/created_at
    // Using order_id range is safer if specific.
    const ordersToDelete = ['1845', '1846', '1848', '1848 N', '1849', '1850', '1851', '1852', '1853'];
    // Note: '1848 N' was in original potentially? Or just 1848.
    // The previous run inserted "1848 N" as the ID because we didn't strip N.
    // We should clean up loosely.

    const { error: delError } = await supabase
        .from('sales')
        .delete()
        .in('order_id', ordersToDelete.concat(['1848 N'])); // Add explicit previous bad ID

    if (delError) {
        console.error('Error cleaning up previous batch:', delError);
        // Continue anyway? converting to update might be better but delete is cleaner for fresh state
    } else {
        console.log('Cleaned up previous batch of orders.');
    }

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found:', csvPath);
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    // Fetch products
    const { data: products } = await supabase.from('products').select('id, name');

    const records = [];
    let lastOrder = {};

    const startIndex = lines[0].toLowerCase().startsWith('nº') || lines[0].toLowerCase().startsWith('pedido') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);

        let rawOrderId = cols[0];
        let dateStr = cols[1];
        let clientName = cols[2];

        // --- Inheritance Logic ---
        if (rawOrderId && rawOrderId !== '-') {
            lastOrder.rawOrderId = rawOrderId;
        } else {
            rawOrderId = lastOrder.rawOrderId;
        }

        if (dateStr && dateStr !== '-') {
            lastOrder.dateStr = dateStr;
        } else {
            dateStr = lastOrder.dateStr;
        }

        if (clientName && clientName !== '-') {
            lastOrder.clientName = clientName;
        } else {
            clientName = lastOrder.clientName;
        }

        // --- Wholesale & ID Parsing ---
        // Check for 'M' or 'N' suffix
        let isWholesale = false;
        let cleanOrderId = rawOrderId;

        if (rawOrderId) {
            if (rawOrderId.toUpperCase().includes(' M')) {
                isWholesale = true;
                cleanOrderId = rawOrderId.replace(/ M/i, '').trim();
            } else if (rawOrderId.toUpperCase().includes(' N')) {
                isWholesale = false;
                cleanOrderId = rawOrderId.replace(/ N/i, '').trim();
            }
        }

        // Parse Model/Size
        const modelAndSize = cols[3] || '';
        const sizeMatch = modelAndSize.match(/T\/(\d+(?:[.,]\d+)?)/i);
        const size = sizeMatch ? sizeMatch[1] : '';

        let productName = modelAndSize;
        if (modelAndSize.includes(' T/')) {
            productName = modelAndSize.split(' T/')[0].trim();
        } else if (modelAndSize.includes(' - ')) {
            const parts = modelAndSize.split(' - ');
            productName = parts[0].trim();
        }

        // Fuzzy match product
        let productId = null;
        if (productName && products) {
            const exact = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
            if (exact) {
                productId = exact.id;
            } else {
                const partial = products.find(p =>
                    p.name.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(p.name.toLowerCase())
                );
                if (partial) productId = partial.id;
            }
        }

        // Date Parsing
        let date = null;
        const year = 2025;

        if (dateStr) {
            const lowerDate = dateStr.toLowerCase().trim();
            if (lowerDate.includes('/')) {
                const [day, month, y] = lowerDate.split('/');
                const fullYear = y ? (y.length === 2 ? '20' + y : y) : year;
                date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        let deliveryRaw = cols[4] || '';

        records.push({
            order_id: cleanOrderId,
            date: date,
            client: clientName,
            product_name: productName,
            size: size,
            details: modelAndSize,
            delivery_date: deliveryRaw,
            status: 'pending',
            product_id: productId,
            is_wholesale: isWholesale
        });
    }

    console.log(`Parsed ${records.length} records to insert.`);

    const { error } = await supabase.from('sales').insert(records);

    if (error) {
        console.error('Error inserting records:', error);
    } else {
        console.log('Successfully inserted records with wholesale flags.');
    }
}

importSales().catch(console.error);
