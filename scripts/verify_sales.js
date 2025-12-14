const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function verify() {
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

    console.log('--- Last 20 Sales ---');
    data.forEach(s => {
        console.log(`[${s.date}] Order: ${s.order_id} | Client: ${s.client} | Product: ${s.product_name} (ID: ${s.product_id}) | Delivery: ${s.delivery_date}`);
    });
}

verify();
