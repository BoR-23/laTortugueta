import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { revalidateProduct } from '@/lib/revalidation'
import sharp from 'sharp'

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

const VARIANT_SPECS: Record<string, number> = {
    full: 1400,
    medium: 900,
    thumb: 360
}

const getKeyFromUrl = (url: string) => {
    if (url.startsWith(R2_PUBLIC_URL)) {
        return url.replace(`${R2_PUBLIC_URL}/`, '')
    }
    if (url.startsWith('/')) {
        return url.substring(1) // Remove leading slash
    }
    return null
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const productId = formData.get('productId') as string
        const targetUrl = formData.get('targetUrl') as string
        const file = formData.get('file') as File

        if (!productId || !targetUrl || !file) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        const targetKey = getKeyFromUrl(targetUrl)
        if (!targetKey) {
            return NextResponse.json({ error: 'URL de imagen inválida' }, { status: 400 })
        }

        // 1. Process uploaded file
        const arrayBuffer = await file.arrayBuffer()
        const originalBuffer = Buffer.from(arrayBuffer)

        // 2. Extract Metadata for response
        const metadata = await sharp(originalBuffer).metadata()
        const exifData = {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            exif: metadata.exif ? 'Presente' : 'No encontrado',
            // We could parse EXIF buffer if needed, but presence is usually enough for confirmation
        }

        // 3. Determine output format and processing
        const isWebP = targetUrl.toLowerCase().endsWith('.webp')
        const pipeline = sharp(originalBuffer).rotate().withMetadata()

        let mainBuffer: Buffer
        let contentType: string

        if (isWebP) {
            mainBuffer = await pipeline
                .clone()
                .webp({ quality: 82 })
                .toBuffer()
            contentType = 'image/webp'
        } else {
            // Keep original format or convert to JPEG if unknown/other
            // Ideally we respect the targetUrl extension
            if (targetUrl.toLowerCase().endsWith('.png')) {
                mainBuffer = await pipeline.png().toBuffer()
                contentType = 'image/png'
            } else {
                mainBuffer = await pipeline.jpeg({ quality: 85 }).toBuffer()
                contentType = 'image/jpeg'
            }
        }

        // 4. Overwrite main image
        console.log(`[restore-exif] Overwriting ${targetKey}...`)
        await uploadToR2(mainBuffer, targetKey, contentType)

        // 5. Regenerate variants
        const pathParts = targetKey.split('/')
        const filename = pathParts.pop() || ''

        console.log(`[restore-exif] Regenerating variants...`)
        await Promise.all(
            Object.entries(VARIANT_SPECS).map(async ([variant, width]) => {
                const variantBuffer = await pipeline
                    .clone()
                    .resize({ width, withoutEnlargement: true })
                    .webp({ quality: 80 }) // Variants are always WebP in our new system? 
                    // Wait, if the main image is JPG, variants might be JPG too in legacy.
                    // But if we are "restoring", maybe we should enforce WebP variants?
                    // Let's stick to WebP for variants as it's the standard now.
                    .toBuffer()

                // Construct variant key. 
                // Note: If the main image was JPG, the variants might have been JPG too.
                // But the `optimize` route creates WebP variants.
                // If we overwrite a JPG main image, we should probably check if we need to update variant extensions.
                // However, for simplicity and since we encourage WebP, let's assume standard variants path.
                // If the original file was `foo.jpg`, variants are usually `.../foo.jpg` (or .webp if optimized).
                // If we are restoring a JPG, we should probably keep variants as JPG?
                // Actually, the user just wants to restore EXIF.
                // If the target is WebP, we use WebP.
                // If the target is JPG, let's try to keep variants as WebP (modern standard) or match extension?
                // The `optimize` route deletes old variants.
                // Let's assume we just overwrite the existing variant files if they exist, or create new ones.
                // Since we don't know the exact variant filenames (extension wise) if they differ from main,
                // we will assume they match the main filename or are WebP.

                // SAFE APPROACH: Generate WebP variants. Most of the site uses them.
                const variantKey = `images/products/_variants/${variant}/${filename}`
                // If filename ends in .jpg, this creates .../foo.jpg which is actually a WebP.
                // Browsers might handle it, but it's messy.
                // If the main image is JPG, we should probably generate JPG variants to match the filename.

                let variantOutputBuffer: Buffer
                let variantContentType: string

                if (isWebP) {
                    variantOutputBuffer = variantBuffer // Already WebP from above logic? No, wait.
                    // Above I put .webp() in the chain.
                    variantContentType = 'image/webp'
                } else {
                    // If main is not WebP, let's match the main format for variants to avoid extension mismatch
                    if (contentType === 'image/png') {
                        variantOutputBuffer = await pipeline.clone().resize({ width, withoutEnlargement: true }).png().toBuffer()
                        variantContentType = 'image/png'
                    } else {
                        variantOutputBuffer = await pipeline.clone().resize({ width, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
                        variantContentType = 'image/jpeg'
                    }
                }

                // Actually, the `optimize` route forces WebP variants.
                // If we are restoring a non-optimized image, we should probably respect its type.
                // But if we use the `webp()` chain above for variants, we are making WebP.

                // Let's refine:
                // If `isWebP` is true, we use WebP variants.
                // If `isWebP` is false, we use the same format as main.

                if (isWebP) {
                    await uploadToR2(variantBuffer, variantKey, 'image/webp')
                } else {
                    await uploadToR2(variantOutputBuffer!, variantKey, variantContentType!)
                }
            })
        )

        // 6. Generate placeholder
        const blurBuffer = await pipeline
            .clone()
            .resize({ width: 32, height: 32, fit: 'cover' })
            .webp({ quality: 40 })
            .toBuffer()
        const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`

        // 7. Update Database (Placeholder only, URL is same)
        const supabase = createSupabaseServerClient()

        // Update product metadata
        const { data: product } = await supabase
            .from('products')
            .select('metadata')
            .eq('id', productId)
            .single()

        if (product?.metadata) {
            const meta = product.metadata as any
            let changed = false

            // Update placeholder
            if (!meta.imagePlaceholders) meta.imagePlaceholders = {}
            if (meta.imagePlaceholders[targetUrl] !== blurDataUrl) {
                meta.imagePlaceholders[targetUrl] = blurDataUrl
                changed = true
            }

            if (changed) {
                await supabase
                    .from('products')
                    .update({ metadata: meta })
                    .eq('id', productId)
            }
        }

        // 8. Revalidate
        revalidateProduct(productId)

        return NextResponse.json({
            success: true,
            metadata: exifData,
            message: 'Imagen restaurada con éxito'
        })

    } catch (error) {
        console.error('Error restoring EXIF:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al restaurar EXIF' },
            { status: 500 }
        )
    }
}
