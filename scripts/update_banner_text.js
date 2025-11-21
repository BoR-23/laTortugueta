const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBanner() {
    const bannerId = 'ef49277e-b124-4bcf-b51b-81bcfc92ca44'; // The ID of the last banner

    const { error } = await supabase
        .from('hero_slides')
        .update({
            title: '',
            subtitle: '',
            cta_text: '',
            cta_link: '' // Optional: remove link too if it's just a promo image without a specific button
        })
        .eq('id', bannerId);

    if (error) {
        console.error('Error updating banner:', error);
        return;
    }

    console.log(`Banner ${bannerId} updated successfully. Text fields cleared.`);
}

updateBanner();
