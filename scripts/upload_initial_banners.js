const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY;
const r2Endpoint = process.env.R2_ENDPOINT || process.env.NEXT_PUBLIC_R2_ENDPOINT;
const r2Bucket = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!supabaseUrl || !serviceKey || !r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint || !r2Bucket) {
    console.error('Missing configuration. Check .env.local');
    console.log({
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        r2AccessKeyId: !!r2AccessKeyId,
        r2SecretAccessKey: !!r2SecretAccessKey,
        r2Endpoint: !!r2Endpoint,
        r2Bucket: !!r2Bucket
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

const r2Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey
    }
});

const bannersDir = path.join(__dirname, '..', 'imagenesBanner');
const slides = [
    {
        file: 'laTortugueta_ini_v001.png',
        title: 'Calcetines Artesanales',
        subtitle: 'Hechos a medida en Alcoi desde 1989',
        cta_text: 'Ver Colección',
        cta_link: '#catalogo',
        priority: 10
    },
    {
        file: 'laTortugueta_ini_v002.png',
        title: 'Diseños Únicos',
        subtitle: 'Tradición y modernidad en cada puntada',
        cta_text: 'Nuestras Novedades',
        cta_link: '#catalogo',
        priority: 20
    },
    {
        file: 'laTortugueta_ini_v003.png',
        title: 'Calidad Premium',
        subtitle: 'Algodón 100% natural y sostenible',
        cta_text: 'Conócenos',
        cta_link: '/quienes-somos',
        priority: 30
    }
];

async function uploadToR2(filePath, key, contentType) {
    const fileContent = fs.readFileSync(filePath);
    const command = new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType
    });
    await r2Client.send(command);
    return `${r2PublicUrl}/${key}`;
}

async function main() {
    console.log('Starting banner upload...');

    // Check if table exists by trying to select from it (limit 0)
    const { error: checkError } = await supabase.from('hero_slides').select('*').limit(0);
    if (checkError) {
        console.error('Error accessing hero_slides table. Does it exist?');
        console.error(checkError.message);
        console.log('Please run the SQL to create the table first.');
        process.exit(1);
    }

    // Delete existing slides to start fresh (optional, but good for this initial setup)
    await supabase.from('hero_slides').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    for (const slide of slides) {
        const filePath = path.join(bannersDir, slide.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        const ext = path.extname(slide.file);
        const key = `banners/${slide.file}`; // Upload to banners/ folder in bucket
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

        console.log(`Uploading ${slide.file} to R2...`);
        try {
            const publicUrl = await uploadToR2(filePath, key, contentType);
            console.log(`Uploaded to ${publicUrl}`);

            console.log(`Inserting into DB...`);
            const { error } = await supabase.from('hero_slides').insert({
                image_url: publicUrl,
                title: slide.title,
                subtitle: slide.subtitle,
                cta_text: slide.cta_text,
                cta_link: slide.cta_link,
                priority: slide.priority,
                active: true
            });

            if (error) {
                console.error(`Error inserting ${slide.file}:`, error.message);
            } else {
                console.log(`Successfully added slide: ${slide.title}`);
            }

        } catch (e) {
            console.error(`Failed to process ${slide.file}:`, e);
        }
    }

    console.log('Done!');
}

main().catch(console.error);
