const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreDescriptions() {
    const productsToUpdate = [
        { name: '3-Fonts', description: 'Calcetines artesanales modelo 3-Fonts.' },
        { name: 'Abdet', description: 'Calcetines artesanales modelo Abdet.' }
    ];

    for (const p of productsToUpdate) {
        const { error } = await supabase
            .from('products')
            .update({ description: p.description })
            .eq('name', p.name);

        if (error) {
            console.error(`Error updating ${p.name}:`, error);
        } else {
            console.log(`Updated description for ${p.name}`);
        }
    }
}

restoreDescriptions();
