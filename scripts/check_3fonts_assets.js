const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssets() {
    console.log('--- Assets for 3-fonts ---');
    const { data: assets, error } = await supabase
        .from('media_assets')
        .select('url, tags')
        .eq('product_id', '3-fonts');

    if (error) {
        console.error(error);
        return;
    }

    assets.forEach(a => console.log(a.url));
}

checkAssets();
