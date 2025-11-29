const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

console.log('--- Debug Info ---');
console.log('NEXT_PUBLIC_R2_PUBLIC_URL:', r2PublicUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrls() {
    // Get a few sample media assets
    const { data: assets, error } = await supabase
        .from('media_assets')
        .select('url')
        .limit(5);

    if (error) {
        console.error('Error fetching assets:', error);
        return;
    }

    console.log('\n--- Sample Database URLs ---');
    assets.forEach(a => {
        console.log(a.url);
        if (r2PublicUrl && !a.url.startsWith(r2PublicUrl)) {
            console.log('⚠️  MISMATCH: Does not start with configured public URL');
        } else if (r2PublicUrl) {
            console.log('✅  MATCH');
        }
    });
}

checkUrls();
