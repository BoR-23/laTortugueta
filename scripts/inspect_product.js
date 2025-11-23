const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, description')
        .in('name', ['3-Fonts', 'Ador', 'Abdet']);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    products.forEach(p => {
        console.log(`\nProduct: ${p.name}`);
        console.log(`Description: "${p.description}"`);
    });
}

inspectProducts();
