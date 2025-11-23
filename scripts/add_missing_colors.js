const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColors() {
    console.log('Checking existing colors in range 100-199...\n');

    // Get existing colors
    const { data: existing, error: fetchError } = await supabase
        .from('categories')
        .select('tag_key')
        .like('tag_key', 'Color 1%')
        .order('tag_key');

    if (fetchError) {
        console.error('Error fetching colors:', fetchError);
        return;
    }

    const existingNumbers = existing
        .filter(c => /^Color 1\d{2}$/.test(c.tag_key))
        .map(c => parseInt(c.tag_key.replace('Color ', '')))
        .sort((a, b) => a - b);

    console.log(`Found ${existingNumbers.length} existing colors in range 100-199`);

    // Find missing colors
    const missing = [];
    for (let i = 100; i <= 199; i++) {
        if (!existingNumbers.includes(i)) {
            missing.push(i);
        }
    }

    if (missing.length === 0) {
        console.log('\n✅ All colors from 100-199 already exist!');
        return;
    }

    console.log(`\n📝 Need to create ${missing.length} colors: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}\n`);

    // Create missing colors
    const newColors = missing.map(num => ({
        id: `color-${num}`,
        scope: 'filter',
        name: `Color ${num}`,
        tag_key: `Color ${num}`,
        parent_id: null,
        sort_order: num
    }));

    // Insert in batches of 50
    const batchSize = 50;
    let created = 0;

    for (let i = 0; i < newColors.length; i += batchSize) {
        const batch = newColors.slice(i, i + batchSize);
        const { error: insertError } = await supabase
            .from('categories')
            .insert(batch);

        if (insertError) {
            console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
            return;
        }

        created += batch.length;
        console.log(`✅ Created ${created}/${newColors.length} colors...`);
    }

    console.log(`\n🎉 Successfully created all ${created} missing colors!`);
}

addMissingColors().catch(err => {
    console.error('Script error:', err);
    process.exit(1);
});
