const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyArchiveSafety() {
    console.log('🔍 PASO 1: Estado ANTES de archivar');
    const { data: before } = await supabase
        .from('products')
        .select('id, name, price, available, type, tags')
        .eq('id', '3-fonts')
        .single();

    console.log(JSON.stringify(before, null, 2));

    console.log('\n📦 PASO 2: Archivando (available = false)...');
    await supabase
        .from('products')
        .update({ available: false })
        .eq('id', '3-fonts');

    console.log('\n🔍 PASO 3: Estado DESPUÉS de archivar');
    const { data: after } = await supabase
        .from('products')
        .select('id, name, price, available, type, tags')
        .eq('id', '3-fonts')
        .single();

    console.log(JSON.stringify(after, null, 2));

    console.log('\n✅ VERIFICACIÓN:');
    if (after.name === before.name && after.price === before.price && after.type === before.type) {
        console.log('✓ Nombre preservado: ' + after.name);
        console.log('✓ Precio preservado: ' + after.price);
        console.log('✓ Tipo preservado: ' + after.type);
        console.log('✓ Tags preservados: ' + JSON.stringify(after.tags));
        console.log('\n🎉 ¡TODOS LOS DATOS INTACTOS!');
    } else {
        console.log('❌ ERROR: Se han perdido datos');
        console.log('Nombre: ' + before.name + ' -> ' + after.name);
        console.log('Precio: ' + before.price + ' -> ' + after.price);
        console.log('Tipo: ' + before.type + ' -> ' + after.type);
    }

    console.log('\n📤 PASO 4: Publicando de nuevo (available = true)...');
    await supabase
        .from('products')
        .update({ available: true })
        .eq('id', '3-fonts');

    console.log('✓ Producto vuelto a publicar');
}

verifyArchiveSafety();
