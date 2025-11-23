const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzePhotoStructure() {
    console.log('📊 Analizando estructura actual de fotos...\n');

    // 1. Ver cuántos productos tienen fotos
    const { data: products, error } = await supabase
        .from('products')
        .select(`
      id,
      name,
      tags,
      media_assets (
        url
      )
    `)
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('📦 Muestra de 5 productos con sus fotos y tags:\n');

    products.forEach(product => {
        console.log(`\n🔹 ${product.name} (${product.id})`);
        console.log(`   Tags del producto: ${JSON.stringify(product.tags)}`);
        console.log(`   Número de fotos: ${product.media_assets?.length || 0}`);

        if (product.media_assets && product.media_assets.length > 0) {
            product.media_assets.forEach((asset, idx) => {
                const filename = asset.url.split('/').pop();
                console.log(`   ${idx + 1}. ${filename}`);
            });
        }
    });

    console.log('\n\n💡 OBSERVACIONES:');
    console.log('- Los tags están a nivel de PRODUCTO');
    console.log('- Todas las fotos del mismo producto comparten los mismos tags');
    console.log('- No hay columna "tags" en media_assets');

    console.log('\n\n📋 PLAN PROPUESTO:');
    console.log('1. Añadir columna "tags" a la tabla media_assets');
    console.log('2. Copiar los tags del producto a todas sus fotos');
    console.log('3. Si metiste info de carpeta en EXIF, podemos extraerla');
    console.log('4. Actualizar UI para gestionar tags por foto');
}

analyzePhotoStructure();
