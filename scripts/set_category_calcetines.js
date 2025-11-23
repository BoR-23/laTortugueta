const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setCategoryToCalcetines() {
    console.log('Setting category to "Calcetines" for all products...');

    // Update all products to have category = "Calcetines"
    const { data, error, count } = await supabase
        .from('products')
        .update({ category: 'Calcetines' })
        .select('id, name, category');

    if (error) {
        console.error('Update Error:', JSON.stringify(error, null, 2));
        throw error;
    }

    console.log(`Successfully updated ${data?.length || 0} products`);
    console.log('\nSample updated products:');
    data?.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name}: category = "${p.category}"`);
    });
}

setCategoryToCalcetines().catch(err => {
    console.error('Script Error:', err);
    process.exit(1);
});
