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

async function simulate() {
    const { data: products } = await supabase.from('products').select('id, name, price');
    const { data: sales } = await supabase.from('sales').select('*').gte('created_at', '2026-03-31T17:40:00Z');

    if (!sales || sales.length === 0) {
        console.log('No sales found from today.');
        return;
    }

    const pMap = products.map(p => ({ ...p, norm: normalize(p.name) }));

    const proposals = [];

    for (const sale of sales) {
        let isWholesale = sale.is_wholesale;
        // Re-check wholesale from order_id or details
        if (sale.order_id && / M$/i.test(sale.order_id)) isWholesale = true;
        if (sale.details && sale.details.toLowerCase().includes('mayor')) isWholesale = true;

        const normName = normalize(sale.product_name);
        let bestMatch = pMap.find(p => p.norm === normName);
        if (!bestMatch) {
            bestMatch = pMap.find(p => p.norm.includes(normName) || normName.includes(p.norm));
        }

        const basePrice = bestMatch ? bestMatch.price : 48; // Default to 48 if unknown
        const expPrice = isWholesale ? basePrice * 0.5 : basePrice;

        if (sale.product_price !== expPrice || sale.is_wholesale !== isWholesale) {
            proposals.push({
                order_id: sale.order_id,
                product: sale.product_name,
                old_price: sale.product_price,
                new_price: expPrice,
                wholesale: isWholesale ? 'M' : 'N',
                id: sale.id
            });
        }
    }

    console.log('PROPOSALS_START');
    console.log('| Pedido | Producto | Precio Actual | Nuevo Precio | Tipo |');
    console.log('|---|---|---|---|---|');
    proposals.slice(0, 20).forEach(p => {
        console.log(`| ${p.order_id} | ${p.product} | ${p.old_price}€ | ${p.new_price}€ | ${p.wholesale} |`);
    });
    console.log('PROPOSALS_END');
    console.log(`Total rows to update: ${proposals.length}`);
}

simulate();
