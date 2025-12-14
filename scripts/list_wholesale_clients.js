const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function listWholesale() {
    const { data, error } = await supabase
        .from('sales')
        .select('client')
        .eq('is_wholesale', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    // Unique names
    const names = [...new Set(data.map(d => d.client))];
    console.log('Existing Wholesale Clients:', names);
}

listWholesale();
