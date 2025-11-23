
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreProducts() {
    console.log('Restoring products...');

    // Restore 3-fonts
    const { error: error1 } = await supabase.from('products').update({
        name: '3-Fonts',
        price: 48.00,
        type: 'Calcetines artesanales',
        tags: ['Calcetines artesanales'],
        available: true
    }).eq('id', '3-fonts');

    if (error1) console.error('Error restoring 3-fonts:', error1);
    else console.log('Restored 3-fonts');

    // Restore Abdet
    const { error: error2 } = await supabase.from('products').update({
        name: 'Abdet',
        price: 0.00,
        type: 'Calcetines artesanales',
        tags: ['Calcetines artesanales'],
        available: true
    }).eq('id', 'abdet');

    if (error2) console.error('Error restoring Abdet:', error2);
    else console.log('Restored Abdet');
}

restoreProducts();
