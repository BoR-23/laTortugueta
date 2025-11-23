const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    console.log('Searching for Benamer...');
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', '%Benamer%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No product found with name containing "Benamer"');
        return;
    }

    products.forEach(p => {
        console.log('--- Product ---');
        console.log('ID:', p.id);
        console.log('Name:', p.name);
        console.log('Tags:', p.tags);
        console.log('Category (if any):', p.category); // Should be undefined if col doesn't exist
        console.log('Media Assets:', JSON.stringify(p.media_assets, null, 2));
    });
}

inspect();
