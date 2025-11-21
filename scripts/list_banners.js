const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listBanners() {
    const { data, error } = await supabase
        .from('hero_slides')
        .select('id, title, subtitle, priority')
        .order('priority', { ascending: true });

    if (error) {
        console.error('Error fetching banners:', error);
        return;
    }

    console.log('Current Banners:');
    data.forEach(banner => {
        console.log(`[${banner.priority}] ID: ${banner.id} | Title: "${banner.title}"`);
    });
}

listBanners();
