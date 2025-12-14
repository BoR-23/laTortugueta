const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function check() {
    // 1. Check one row to see columns
    const { data: oneRow, error: err1 } = await supabase.from('sales').select('*').limit(1);
    if (err1) console.error('Error fetching row:', err1);
    else console.log('Columns:', oneRow.length ? Object.keys(oneRow[0]) : 'No rows found');

    // 2. Check strict wholesale clients from the new list
    const clientsToCheck = [
        'Brocat', 'Rafa Simo', 'J.M. Sabater', 'Rosa Tomas',
        'Imma (Carcaixent)', 'Hijas Carmen Esteve', 'Amparo Gonzalez'
    ];

    // Fetch *previous* sales (not the ones we just added) to see their status
    // We assume the ones we just added have is_wholesale = false/null (or default)
    // We want to see if these clients have older sales with is_wholesale = true

    const { data: clientStats, error: err2 } = await supabase
        .from('sales')
        .select('client, is_wholesale')
        .in('client', clientsToCheck);

    if (err2) {
        console.error('Error fetching stats:', err2);
        return;
    }

    const wholesaleClients = new Set();
    clientStats.forEach(s => {
        if (s.is_wholesale) wholesaleClients.add(s.client);
    });

    console.log('Clients with existing WHOLESALE orders:', Array.from(wholesaleClients));
}

check();
