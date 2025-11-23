const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearLegacyCategories() {
    console.log('Starting cleanup of legacy "category" column...');

    // Update all products to have category = null
    const { data, error, count } = await supabase
        .from('products')
        .update({ category: null })
        .neq('category', null) // Only update if not already null (syntax might vary, usually .not('category', 'is', null))
        .select('id, name');

    // Note: .neq('category', null) might not work as expected for NULL checks in all Supabase versions/wrappers.
    // A safer bet for "is not null" is .not('category', 'is', null)

    // Let's try a direct update without filter to be sure, or use the correct filter.
    // But updating everything to null is safe if we want to clear it all.
    // However, to report count, let's try to filter first.
}

async function run() {
    try {
        console.log('Connecting to Supabase...');

        // Try simple select
        const { data, error } = await supabase
            .from('products')
            .select('id, name, category')
            .limit(1);

        if (error) {
            console.error('Select Error:', JSON.stringify(error, null, 2));
            throw error;
        }
        console.log('Connection successful. Sample data:', data);

        // Perform update
        console.log('Attempting update...');
        const { error: updateError, count } = await supabase
            .from('products')
            .update({ category: null })
            .not('category', 'is', null);

        if (updateError) {
            console.error('Update Error:', JSON.stringify(updateError, null, 2));
            throw updateError;
        }

        console.log('Successfully cleared legacy categories.');
    } catch (err) {
        console.error('Script Error:', err);
    }
}

run();
