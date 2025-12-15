const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function verifyBatch2() {
    const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('order_id', '1854'); // Cleaned ID

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`--- Order 1854 Verification (${data.length} items) ---`);
    data.forEach(s => {
        const flag = s.is_wholesale ? 'WHOLESALE' : 'RETAIL';
        console.log(`[${flag}] Date: ${s.date} | Product: ${s.product_name} | Delivery: ${s.delivery_date}`);
    });
}

verifyBatch2();
