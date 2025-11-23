const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, tag_key')
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    console.log('Categories:');
    data.forEach(cat => {
        console.log(`- Name: "${cat.name}", Tag Key: "${cat.tag_key}"`);
    });
}

dumpCategories();
