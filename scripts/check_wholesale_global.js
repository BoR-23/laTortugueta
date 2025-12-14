const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function checkGlobal() {
    const { count, error } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('is_wholesale', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total rows with is_wholesale=true: ${count}`);
}

checkGlobal();
