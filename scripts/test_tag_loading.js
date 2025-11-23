const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTagLoading() {
    console.log('Testing tag loading for ProductTaggingGalleryModal...\n');

    const { data, error } = await supabase
        .from('categories')
        .select('tag_key, scope')
        .not('tag_key', 'is', null)
        .in('scope', ['header', 'filter']);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const uniqueTags = Array.from(new Set(data.map(cat => cat.tag_key).filter(Boolean)));
    const sorted = uniqueTags.sort();
    const general = sorted.filter(t => !t.startsWith('Color'));
    const colors = sorted.filter(t => t.startsWith('Color'));

    console.log(`Total unique tags: ${uniqueTags.length}`);
    console.log(`General tags: ${general.length}`);
    console.log(`Color tags: ${colors.length}\n`);

    console.log('First 10 general tags:');
    general.slice(0, 10).forEach(tag => console.log(`  - ${tag}`));

    console.log('\nFirst 10 color tags:');
    colors.slice(0, 10).forEach(tag => console.log(`  - ${tag}`));
}

testTagLoading();
