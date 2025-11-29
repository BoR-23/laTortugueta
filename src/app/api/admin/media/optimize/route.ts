import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { downloadFromR2, uploadToR2, deleteFromR2 } from '@/lib/r2'
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
        const { productId, url } = await request.json()

        if (!productId || !url) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        if (url.endsWith('.webp')) {
            return NextResponse.json({ error: 'La imagen ya está optimizada (WebP)' }, { status: 400 })
        }

        const oldKey = getKeyFromUrl(url)
        if (!oldKey) {
            return NextResponse.json({ error: 'URL de imagen inválida' }, { status: 400 })
        }

        // 1. Download original image
        console.log(`[optimize] Downloading ${oldKey}...`)
        const originalBuffer = await downloadFromR2(oldKey)

        // 2. Prepare new filename (change extension to .webp)
        const pathParts = oldKey.split('/')
        const oldFilename = pathParts.pop() || ''
        const baseName = oldFilename.substring(0, oldFilename.lastIndexOf('.')) || oldFilename
        const newFilename = `${baseName}.webp`
        const newKey = [...pathParts, newFilename].join('/')
        const newUrl = `${R2_PUBLIC_URL}/${newKey}`

        // 3. Process with Sharp (Preserve Metadata/EXIF)
        const pipeline = sharp(originalBuffer).rotate().withMetadata()

        // 4. Upload main WebP image
        console.log(`[optimize] Converting main image to ${newKey}...`)
        const mainBuffer = await pipeline
            .clone()
            .webp({ quality: 82 })
            .toBuffer()

        await uploadToR2(mainBuffer, newKey, 'image/webp')

        // 5. Generate and upload variants
        console.log(`[optimize] Generating variants...`)
        await Promise.all(
            Object.entries(VARIANT_SPECS).map(async ([variant, width]) => {
                const variantBuffer = await pipeline
                    .clone()
                    .resize({ width, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer()

                // Construct variant key: images/products/_variants/{variant}/{filename}
                // Assuming standard structure. If oldKey was in a variant folder, we should be careful.
                // But usually we optimize the "original" which is in images/products/
                // Let's assume input URL is the main image.
                const variantKey = `images/products/_variants/${variant}/${newFilename}`
                await uploadToR2(variantBuffer, variantKey, 'image/webp')
            })
        )

        // 6. Generate placeholder
        const blurBuffer = await pipeline
            .clone()
            .resize({ width: 32, height: 32, fit: 'cover' })
            .webp({ quality: 40 })
            .toBuffer()
        const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`

        // 7. Update Database
        const supabase = createSupabaseServerClient()

        // Update media_assets
        const { error: dbError } = await supabase
            .from('media_assets')
            .update({ url: newUrl })
            .eq('product_id', productId)
            .eq('url', url)

        if (dbError) {
            throw new Error(`Error actualizando BD: ${dbError.message}`)
        }

        // Update product metadata (placeholders, reviews)
        const { data: product } = await supabase
            .from('products')
            .select('metadata')
            .eq('id', productId)
            .single()

        if (product?.metadata) {
            const meta = product.metadata as any
            let changed = false

            // Update placeholders
            if (!meta.imagePlaceholders) meta.imagePlaceholders = {}

            // Remove old placeholder if exists
            if (meta.imagePlaceholders[url]) {
                delete meta.imagePlaceholders[url]
                changed = true
            }
            // Add new placeholder
            meta.imagePlaceholders[newUrl] = blurDataUrl
            changed = true

            // Update reviews
            if (meta.imageReview && typeof meta.imageReview[url] !== 'undefined') {
                meta.imageReview[newUrl] = meta.imageReview[url]
                delete meta.imageReview[url]
                changed = true
            }

            if (changed) {
                await supabase
                    .from('products')
                    .update({ metadata: meta })
                    .eq('id', productId)
            }
        }

        // 8. Delete old files (main + variants)
        console.log(`[optimize] Deleting old files...`)
        await deleteFromR2(oldKey)

        // Try to delete old variants too
        await Promise.all(
            Object.keys(VARIANT_SPECS).map(async (variant) => {
                const oldVariantKey = `images/products/_variants/${variant}/${oldFilename}`
                try {
                    await deleteFromR2(oldVariantKey)
                } catch (e) {
                    // Ignore errors if variant didn't exist
                    console.warn(`Could not delete old variant ${oldVariantKey}`, e)
                }
            })
        )

        // 9. Revalidate
        revalidateProduct(productId)

        return NextResponse.json({ success: true, newUrl, placeholder: blurDataUrl })
    } catch (error) {
        console.error('Error optimizing image:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al optimizar imagen' },
            { status: 500 }
        )
    }
}
