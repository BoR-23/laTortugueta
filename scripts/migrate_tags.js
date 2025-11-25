const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateTags() {
    console.log('Starting tag migration...');

    // 1. Fetch all products with their tags and media assets
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, tags, media_assets(*)');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products.`);

    let updatedCount = 0;

    for (const product of products) {
        const productTags = product.tags || [];
        if (productTags.length === 0) continue;

        const assets = product.media_assets || [];
        if (assets.length === 0) continue;

        for (const asset of assets) {
            const currentAssetTags = asset.tags || [];
            // Merge tags, avoiding duplicates
            const newTags = [...new Set([...currentAssetTags, ...productTags])];

            // Only update if there are new tags added
            if (newTags.length > currentAssetTags.length) {
                const { error: updateError } = await supabase
                    .from('media_assets')
                    .update({ tags: newTags })
                    .eq('id', asset.id);

                if (updateError) {
                    console.error(`Failed to update asset ${asset.id} for product ${product.name}:`, updateError);
                } else {
                    updatedCount++;
                    console.log(`Updated asset ${asset.id} for product "${product.name}" with tags: ${newTags.join(', ')}`);
                }
            }
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} media assets.`);
}

migrateTags();
