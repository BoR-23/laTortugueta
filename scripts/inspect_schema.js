const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
    // Check products table for metadata
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('metadata')
        .not('metadata', 'is', null)
        .limit(1);

    if (prodError) {
        console.error('Products Error:', prodError);
    } else {
        console.log('Metadata Sample:', JSON.stringify(products[0]?.metadata, null, 2));
    }

    // Check media_assets table
    const { data: assets, error: assetError } = await supabase
        .from('media_assets')
        .select('*')
        .limit(1);

    if (assetError) {
        console.error('Assets Error:', assetError);
    } else {
        console.log('Assets Sample:', Object.keys(assets[0] || {}));
    }
}

inspectSchema();
