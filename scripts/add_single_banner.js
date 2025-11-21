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
const newSlide = {
    file: 'laTortugueta_ini_v004.png',
    title: 'Artesanía Viva',
    subtitle: 'Descubre nuestra nueva colección',
    cta_text: 'Ver Catálogo',
    cta_link: '#catalogo',
    priority: 40
};

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
    console.log('Starting single banner upload...');

    const filePath = path.join(bannersDir, newSlide.file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const ext = path.extname(newSlide.file);
    const key = `banners/${newSlide.file}`;
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    console.log(`Uploading ${newSlide.file} to R2...`);
    try {
        const publicUrl = await uploadToR2(filePath, key, contentType);
        console.log(`Uploaded to ${publicUrl}`);

        console.log(`Inserting into DB...`);
        const { error } = await supabase.from('hero_slides').insert({
            image_url: publicUrl,
            title: newSlide.title,
            subtitle: newSlide.subtitle,
            cta_text: newSlide.cta_text,
            cta_link: newSlide.cta_link,
            priority: newSlide.priority,
            active: true
        });

        if (error) {
            console.error(`Error inserting ${newSlide.file}:`, error.message);
        } else {
            console.log(`Successfully added slide: ${newSlide.title}`);
        }

    } catch (e) {
        console.error(`Failed to process ${newSlide.file}:`, e);
    }

    console.log('Done!');
}

main().catch(console.error);
