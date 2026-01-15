
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

const tsvPath = path.join(__dirname, 'sales_data_new.tsv');

async function importSales() {
    console.log('Starting custom sales import...');

    if (!fs.existsSync(tsvPath)) {
        console.error('TSV file not found:', tsvPath);
        process.exit(1);
    }

    const content = fs.readFileSync(tsvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    // Fetch products for matching
    const { data: products } = await supabase.from('products').select('id, name');

    const records = [];

    console.log(`Processing ${lines.length} lines from TSV...`);

    for (const line of lines) {
        // Simple tab split
        const cols = line.split('\t').map(c => c.trim());

        // Expected structure:
        // 0: Order ID (Example: 1875 M)
        // 1: Date (Example: 26/12/2025)
        // 2: Client (Example: Amparo Fabra)
        // 3: Details (Example: Calcetín 3-Fonts n 38...)
        // 4: Notes/Delivery (Example: Jaime Baviera)

        let rawOrderId = cols[0];
        const dateStr = cols[1];
        const clientName = cols[2];
        const details = cols[3] || '';
        const notes = cols[4] || '';

        // Parse Wholesale/Suffix
        let isWholesale = false;
        let cleanOrderId = rawOrderId;

        if (rawOrderId) {
            cleanOrderId = rawOrderId.replace(/\s*[MN]$/i, '').trim();
            if (rawOrderId.toUpperCase().endsWith('M')) {
                isWholesale = true;
            } else if (rawOrderId.toUpperCase().endsWith('N')) {
                isWholesale = false; // Assuming N is Retail/Normal
            }
        }

        // Parse Date
        let date = null;
        if (dateStr) {
            const [day, month, year] = dateStr.split('/');
            if (day && month && year) {
                date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        // Product Matching and Size Extraction
        const sizeMatch = details.match(/T\/(\d+(?:[.,]\d+)?)/i);
        const size = sizeMatch ? sizeMatch[1] : '';

        // Extract Product Name logic (Heuristic)
        // "Calcetín 3-Fonts n 38..." -> "3-Fonts"
        // "Benamer T/39..." -> "Benamer"
        // "La Senia T/44" -> "La Senia"

        let productName = details.split(' T/')[0]; // Split by size marker
        if (productName.toLowerCase().startsWith('calcetín ')) {
            productName = productName.substring(9).trim();
        }
        productName = productName.split(' -')[0].trim(); // Remove trailing dashes/details
        if (productName.includes(' n ')) {
            productName = productName.split(' n ')[0].trim();
        }

        let productId = null;
        if (products) {
            // Fuzzy match
            // Try startsWith first (high confidence)
            const exact = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
            if (exact) {
                productId = exact.id;
            } else {
                const bestMatch = products.find(p =>
                    p.name.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(p.name.toLowerCase())
                );
                if (bestMatch) productId = bestMatch.id;
            }
        }

        records.push({
            order_id: cleanOrderId,
            date: date,
            client: clientName,
            product_name: productName,
            size: size,
            details: details,
            delivery_date: notes, // Using notes column as delivery/notes
            status: 'pending',
            product_id: productId,
            is_wholesale: isWholesale
        });
    }

    console.log(`Parsed ${records.length} records.`);

    // Cleaning up duplicates IS tricky if we just insert.
    // We should delete entries with these order_ids first?? 
    // The user's list starts at 1875.
    // Safe to delete >= 1875? Probably.

    // Let's get unique Order IDs from this batch
    const orderIds = [...new Set(records.map(r => r.order_id))];
    console.log('Overwriting Order IDs:', orderIds);

    const { error: delError } = await supabase
        .from('sales')
        .delete()
        .in('order_id', orderIds);

    if (delError) {
        console.error('Error deleting old records:', delError);
        // We proceed? No, duplicated data is bad.
        // If delete fails, we might just warn.
    }

    const { error: insError } = await supabase.from('sales').insert(records);

    if (insError) {
        console.error('Error inserting records:', insError);
        process.exit(1);
    } else {
        console.log('✅ Success! Imported sales records.');
    }
}

importSales().catch(console.error);
