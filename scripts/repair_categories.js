const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function repairCategories() {
    console.log('Starting category repair...');

    // 1. Fix "De Home" -> "de Hombre"
    const { data: deHome } = await supabase
        .from('categories')
        .select('*')
        .ilike('tag_key', 'De Home')
        .single();

    if (deHome) {
        console.log('Fixing "De Home" tag...');
        await supabase
            .from('categories')
            .update({ tag_key: 'de Hombre' }) // Keep name as is if it's correct, or update both? User said "se llama DE hombre"
            .eq('id', deHome.id);
    }

    // 2. Move unnested colors to "Colores"
    const { data: coloresCat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Colores')
        .single();

    if (coloresCat) {
        console.log('Found "Colores" category:', coloresCat.id);
        const { data: looseColors } = await supabase
            .from('categories')
            .select('*')
            .ilike('name', 'Color %')
            .is('parent_id', null);

        if (looseColors && looseColors.length > 0) {
            console.log(`Found ${looseColors.length} loose color categories. Moving to "Colores"...`);
            for (const color of looseColors) {
                await supabase
                    .from('categories')
                    .update({ parent_id: coloresCat.id })
                    .eq('id', color.id);
                console.log(`Moved ${color.name}`);
            }
        }
    } else {
        console.error('Category "Colores" not found!');
    }

    // 3. Fix "Calces *" categories
    const zombies = [
        { name: 'Calces De Ratlles', target: 'Rayas' },
        { name: 'Calces Llisses', target: 'Lisas' }
    ];

    for (const zombie of zombies) {
        const { data: zombieCat } = await supabase
            .from('categories')
            .select('*')
            .eq('name', zombie.name)
            .single();

        if (zombieCat) {
            console.log(`Found zombie category: ${zombie.name}`);

            // Find target category
            const { data: targetCat } = await supabase
                .from('categories')
                .select('*')
                .eq('name', zombie.target)
                .single();

            if (targetCat) {
                console.log(`Migrating products from "${zombie.name}" to "${zombie.target}"...`);

                // Update products that might have the zombie tag
                // Note: products use 'tags' array (text[]). We need to replace the string in the array.
                // But since we are running migrate_tags.js separately, maybe we just need to update the category reference?
                // Actually, categories are linked via `tag_key`. If a product has "Calces De Ratlles" in its tags, it shows up in that category.
                // We need to replace "Calces De Ratlles" with "Rayas" in product tags.

                // Fetch products with the zombie tag
                const { data: products } = await supabase
                    .from('products')
                    .select('id, tags')
                    .contains('tags', [zombieCat.tag_key]);

                if (products && products.length > 0) {
                    for (const product of products) {
                        const newTags = product.tags.map(t => t === zombieCat.tag_key ? targetCat.tag_key : t);
                        // Deduplicate just in case
                        const uniqueTags = [...new Set(newTags)];
                        await supabase
                            .from('products')
                            .update({ tags: uniqueTags })
                            .eq('id', product.id);
                        console.log(`Updated product ${product.id}`);
                    }
                }

                // Now delete the zombie category
                await supabase.from('categories').delete().eq('id', zombieCat.id);
                console.log(`Deleted category: ${zombie.name}`);
            } else {
                console.error(`Target category "${zombie.target}" not found! Cannot migrate.`);
            }
        }
    }
}

repairCategories();
