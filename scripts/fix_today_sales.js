const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, 'c')
        .replace(/z/g, 's')
        .replace(/[^a-z0-9]/g, '');
}

async function runUpdate() {
    console.log('Fetching products and today\'s sales...');
    const { data: products } = await supabase.from('products').select('id, name, price');
    const { data: sales } = await supabase.from('sales').select('*').gte('created_at', '2026-03-31T17:40:00Z');

    if (!sales || sales.length === 0) {
        console.log('No sales found to update.');
        return;
    }

    const pMap = products.map(p => ({ ...p, norm: normalize(p.name) }));

    let count = 0;
    for (const sale of sales) {
        let isWholesale = sale.is_wholesale;
        // Re-detect wholesale to be sure
        if (sale.order_id && / M$/i.test(sale.order_id)) isWholesale = true;
        if (sale.details && sale.details.toLowerCase().includes('mayor')) isWholesale = true;

        const normName = normalize(sale.product_name);
        
        // Better matching: prioritize exact then partial
        let bestMatch = pMap.find(p => p.norm === normName);
        if (!bestMatch) {
            // Check for Santa Faz -> Santa Fac handle explicitly or by partial
            bestMatch = pMap.find(p => p.norm.includes(normName) || normName.includes(p.norm));
        }

        const basePrice = bestMatch ? bestMatch.price : 48; // Default to 48 as safety fallback
        const expPrice = isWholesale ? basePrice * 0.5 : basePrice;

        if (sale.product_price !== expPrice || sale.is_wholesale !== isWholesale || !sale.product_id) {
            const updateObj = {
                product_price: expPrice,
                is_wholesale: isWholesale,
                product_id: bestMatch ? bestMatch.id : null
            };

            const { error } = await supabase.from('sales').update(updateObj).eq('id', sale.id);
            if (error) {
                console.error(`Error updating sale ${sale.id}:`, error);
            } else {
                count++;
            }
        }
    }

    console.log(`Successfully updated ${count} records.`);
}

runUpdate().catch(console.error);
