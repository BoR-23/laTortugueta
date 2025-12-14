const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function verifyWholesale() {
    // Fetch last 20 sales created
    const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Verified Sales (Wholesale Check) ---');
    data.forEach(s => {
        const flag = s.is_wholesale ? '[WHOLESALE]' : '[RETAIL]';
        console.log(`${flag} Order: ${s.order_id} | Client: ${s.client} | Product: ${s.product_name}`);
    });
}

verifyWholesale();
