const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const exifr = require('exifr');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function inspectExifData() {
    console.log('📸 Inspeccionando EXIF de las primeras 10 fotos...\n');

    // Listar objetos en R2
    const listCommand = new ListObjectsV2Command({
        Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME,
        Prefix: 'images/products/',
        MaxKeys: 10
    });

    const { Contents } = await s3Client.send(listCommand);

    if (!Contents || Contents.length === 0) {
        console.log('No se encontraron fotos');
        return;
    }

    for (const item of Contents) {
        if (!item.Key) continue;

        // Solo fotos originales (no variantes)
        if (item.Key.includes('_thumb') || item.Key.includes('_medium') || item.Key.includes('_large')) {
            continue;
        }

        console.log(`\n🔍 ${item.Key}`);

        try {
            const getCommand = new GetObjectCommand({
                Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME,
                Key: item.Key
            });

            const { Body } = await s3Client.send(getCommand);
            const chunks = [];
            for await (const chunk of Body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            // Extraer EXIF
            const exif = await exifr.parse(buffer, {
                tiff: true,
                exif: true,
                gps: false,
                interop: false,
                ifd0: true,
                ifd1: false
            });

            if (exif) {
                console.log('  ✓ EXIF encontrado:');
                if (exif.ImageDescription) console.log(`    - ImageDescription: ${exif.ImageDescription}`);
                if (exif.UserComment) console.log(`    - UserComment: ${exif.UserComment}`);
                if (exif.XPKeywords) console.log(`    - XPKeywords: ${exif.XPKeywords}`);
                if (exif.XPSubject) console.log(`    - XPSubject: ${exif.XPSubject}`);
                if (exif.XPComment) console.log(`    - XPComment: ${exif.XPComment}`);

                // Mostrar todos los campos que contengan info útil
                Object.keys(exif).forEach(key => {
                    if (key.toLowerCase().includes('comment') ||
                        key.toLowerCase().includes('description') ||
                        key.toLowerCase().includes('keyword') ||
                        key.toLowerCase().includes('subject')) {
                        console.log(`    - ${key}: ${exif[key]}`);
                    }
                });
            } else {
                console.log('  ✗ No tiene EXIF');
            }
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
        }
    }
}

inspectExifData().catch(console.error);
