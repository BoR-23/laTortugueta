
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSales() {
    console.log('Checking sales for "Taronger"...');

    const { data, error } = await supabase
        .from('sales')
        .select('*')
        .ilike('product_name', '%Taronger%')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No sales found for "Taronger"');
        return;
    }

    console.log('Recent Sales (Full Object):');
    data.forEach(s => {
        console.log(JSON.stringify(s, null, 2));
    });
}

checkSales();
