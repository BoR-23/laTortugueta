const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreProducts() {
    const updates = {
        material: "Algodón artesanal",
        origin: "Tejidos artesanalmente en España",
        care: "Lavar a mano con agua fría, no usar secadora",
        color: "Multicolor"
    };

    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .in('name', ['3-Fonts', 'Abdet'])
        .select();

    if (error) {
        console.error('Error updating products:', error);
    } else {
        console.log('Successfully updated products:', data.map(p => p.name));
    }
}

restoreProducts();
