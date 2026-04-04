const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[cz]/g, 's')
        .replace(/[^a-z0-9]/g, '');
}

async function globalFix() {
    console.log('Starting global wholesale price correction...');
    const { data: products } = await supabase.from('products').select('id, name, price');
    const { data: sales } = await supabase.from('sales').select('*');

    const pMap = products.map(p => {
        const norm = normalize(p.name);
        if (norm.includes('santafa')) {
            console.log('pMap entry:', { id: p.id, name: p.name, norm });
        }
        return { ...p, norm };
    });

    let count = 0;
    for (const sale of sales) {
        // Condition: Is it wholesale? (Already marked OR suffix M OR "mayor" in names)
        const isWholesale = (
            sale.is_wholesale || 
            (sale.order_id && / M$/i.test(sale.order_id.trim())) ||
            (sale.client && sale.client.toLowerCase().includes('mayor')) ||
            (sale.details && sale.details.toLowerCase().includes('mayor'))
        );

        if (isWholesale) {
            let saleProdName = sale.product_name || '';
            // Basic cleaning for matching: split by common separators
            if (saleProdName.includes(' T/')) saleProdName = saleProdName.split(' T/')[0];
            if (saleProdName.includes(' - ')) saleProdName = saleProdName.split(' - ')[0];

            const normName = normalize(saleProdName.trim());
            let bestMatch = pMap.find(p => p.norm === normName);
            if (!bestMatch) {
                bestMatch = pMap.find(p => p.norm.includes(normName) || (normName.length > 3 && p.norm.includes(normName)));
            }
            
            // If no match by name, check product_id
            if (!bestMatch && sale.product_id) {
                bestMatch = pMap.find(p => p.id === sale.product_id);
            }

            if (sale.order_id === '1874') {
                console.log('DEBUG 1874:', { product_name: sale.product_name, normName, bestMatch: bestMatch ? bestMatch.name : 'NONE', price: bestMatch ? bestMatch.price : 'N/A' });
            }

            if (bestMatch && bestMatch.price > 0) {
                const expPrice = bestMatch.price * 0.5;
                const currentPrice = sale.product_price || 0;

                if (Math.abs(currentPrice - expPrice) > 0.05 || !sale.is_wholesale) {
                    await supabase.from('sales').update({
                        product_price: expPrice,
                        is_wholesale: true,
                        product_id: bestMatch.id
                    }).eq('id', sale.id);
                    count++;
                }
            }
        }
    }
    console.log(`Global fix finished. Updated ${count} wholesale orders with correct 50% pricing.`);
}

globalFix().catch(console.error);
