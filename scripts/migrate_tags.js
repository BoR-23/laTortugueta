const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MAPPINGS = [
    { old: 'Calces De Ratlles', new: 'Rayas' },
    { old: 'Calces Llisses', new: 'Lisas' },
    { old: 'De Home', new: 'de Hombre' },
    { old: 'Bordats', new: 'Bordados' },
    { old: 'Bordats Grans', new: 'Bordados Grandes' },
    { old: 'Bordats Petits', new: 'Bordados Pequeños' },
    { old: 'Bordats a Ma', new: 'Bordados a Mano' },
    { old: 'Dibuix Vertical', new: 'Dibujo Vertical' },
    { old: 'de Quatre Colors', new: 'de Cuatro Colores' },
    { old: 'de Dos Colors', new: 'de Dos Colores' },
    { old: 'de Cigrons', new: 'de Garbanzos' },
    { old: 'de Tres Colors', new: 'de Tres Colores' },
    { old: 'sense Calats', new: 'sin Calados' }
];

async function migrateTags() {
    console.log('Starting tag migration...');

    for (const mapping of MAPPINGS) {
        console.log(`Processing: "${mapping.old}" -> "${mapping.new}"`);

        // 1. Find products with the old tag
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('id, tags')
            .contains('tags', [mapping.old]);

        if (fetchError) {
            console.error(`Error fetching products for ${mapping.old}:`, fetchError);
            continue;
        }

        if (!products || products.length === 0) {
            console.log(`  No products found with tag "${mapping.old}"`);
        } else {
            console.log(`  Found ${products.length} products to update.`);

            for (const product of products) {
                const newTags = product.tags
                    .filter(t => t !== mapping.old) // Remove old
                    .concat(mapping.new) // Add new
                    // Unique
                    .filter((t, i, self) => self.indexOf(t) === i);

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ tags: newTags })
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`  Failed to update product ${product.id}:`, updateError);
                } else {
                    // console.log(`  Updated product ${product.id}`);
                }
            }
            console.log(`  Updated ${products.length} products.`);
        }

        // 2. Delete the old category if it exists
        // We search by tag_key or name
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id')
            .or(`tag_key.eq.${mapping.old},name.eq.${mapping.old}`);

        if (catError) {
            console.error(`Error fetching category ${mapping.old}:`, catError);
        } else if (categories && categories.length > 0) {
            console.log(`  Found ${categories.length} categories to delete for "${mapping.old}"`);
            const ids = categories.map(c => c.id);
            const { error: delError } = await supabase
                .from('categories')
                .delete()
                .in('id', ids);

            if (delError) {
                console.error(`  Failed to delete categories:`, delError);
            } else {
                console.log(`  Deleted categories.`);
            }
        } else {
            console.log(`  No categories found for "${mapping.old}"`);
        }
    }

    console.log('Migration complete.');
}

migrateTags();
