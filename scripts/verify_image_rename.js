const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// R2 Config
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT || process.env.NEXT_PUBLIC_R2_ENDPOINT;
const bucket = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;

if (!supabaseUrl || !supabaseKey || !accessKeyId || !secretAccessKey || !endpoint || !bucket) {
    console.error('Faltan credenciales en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const r2 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey }
});

async function verifyRename(filenamePart) {
    console.log(`\n🔍 Buscando "${filenamePart}" en BD y R2...\n`);

    // 1. Check DB
    const { data: assets, error } = await supabase
        .from('media_assets')
        .select('product_id, url, tags')
        .ilike('url', `%${filenamePart}%`);

    if (error) {
        console.error('❌ Error DB:', error.message);
    } else {
        console.log(`✅ Base de Datos: ${assets.length} coincidencia(s)`);
        assets.forEach(a => console.log(`   - [${a.product_id}] ${a.url}`));
    }

    // 2. Check R2
    try {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            // R2 doesn't support suffix filtering easily, so we list and filter
        });
        const response = await r2.send(command);
        const r2Matches = (response.Contents || [])
            .filter(obj => obj.Key.includes(filenamePart))
            .map(obj => obj.Key);

        console.log(`\n✅ R2 Storage: ${r2Matches.length} coincidencia(s)`);
        r2Matches.forEach(k => console.log(`   - ${k}`));

    } catch (err) {
        console.error('❌ Error R2:', err.message);
    }
    console.log('\n-----------------------------------');
}

const target = process.argv[2];
if (!target) {
    console.log('Uso: node scripts/verify_image_rename.js <parte-del-nombre>');
} else {
    verifyRename(target);
}
