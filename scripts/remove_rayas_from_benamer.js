const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function removeRayas() {
    console.log('Fetching Benamer products...');
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', '%Benamer%');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    for (const p of products) {
        if (p.tags && p.tags.includes('Rayas')) {
            const newTags = p.tags.filter(t => t !== 'Rayas');
            console.log(`Removing 'Rayas' from ${p.name} (${p.id}). New tags:`, newTags);

            const { error: updateError } = await supabase
                .from('products')
                .update({ tags: newTags })
                .eq('id', p.id);

            if (updateError) {
                console.error(`Failed to update ${p.name}:`, updateError);
            } else {
                console.log(`Updated ${p.name}`);
            }
        } else {
            console.log(`Skipping ${p.name} (no Rayas tag)`);
        }
    }
}

removeRayas();
