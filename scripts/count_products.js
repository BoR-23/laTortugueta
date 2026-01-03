require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function countProducts() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting products:', error);
    } else {
        console.log('Total products in database:', count);
    }
}

countProducts();
