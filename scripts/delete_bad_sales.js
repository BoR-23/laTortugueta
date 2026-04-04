const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Fetching bad rows created since 17:40Z (approx 10-15 mins ago)...');
    const { data, error } = await supabase
        .from('sales')
        .select('id, order_id, created_at')
        .gte('created_at', '2026-03-31T17:40:00Z');

    if (error) {
        console.error('Error fetching records:', error);
        process.exit(1);
    }

    console.log(`Found ${data.length} records. Example mapping order_id:`, data[0] && data[0].order_id);

    if (data.length > 0) {
        const ids = data.map(r => r.id);
        const { error: delError } = await supabase.from('sales').delete().in('id', ids);
        if (delError) {
            console.error('Error deleting:', delError);
        } else {
            console.log(`Deleted ${data.length} records successfully.`);
        }
    }
}

run().catch(console.error);
