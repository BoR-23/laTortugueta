const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSettings() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing site_settings:', error);
    } else {
        console.log('site_settings table exists. Data:', data);
    }
}

inspectSettings();
