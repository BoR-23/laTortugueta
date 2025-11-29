import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { copyR2Object, deleteFromR2 } from '@/lib/r2'
import { revalidateProduct } from '@/lib/revalidation'

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

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
        const { productId, oldUrl, newFilename } = await request.json()

        if (!productId || !oldUrl || !newFilename) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        const oldKey = getKeyFromUrl(oldUrl)
        if (!oldKey) {
            return NextResponse.json({ error: 'URL de imagen inválida' }, { status: 400 })
        }

        // Construct new key preserving directory
        const pathParts = oldKey.split('/')
        pathParts.pop() // remove filename
        const newKey = [...pathParts, newFilename].join('/')
        const newUrl = `${R2_PUBLIC_URL}/${newKey}`

        // 1. Copy object in R2
        await copyR2Object(oldKey, newKey)

        // 2. Update Supabase
        const supabase = createSupabaseServerClient()

        // Update media_assets
        const { error: dbError } = await supabase
            .from('media_assets')
            .update({ url: newUrl })
            .eq('product_id', productId)
            .eq('url', oldUrl)

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
            if (meta.imagePlaceholders && meta.imagePlaceholders[oldUrl]) {
                meta.imagePlaceholders[newUrl] = meta.imagePlaceholders[oldUrl]
                delete meta.imagePlaceholders[oldUrl]
                changed = true
            }

            // Update reviews
            if (meta.imageReview && typeof meta.imageReview[oldUrl] !== 'undefined') {
                meta.imageReview[newUrl] = meta.imageReview[oldUrl]
                delete meta.imageReview[oldUrl]
                changed = true
            }

            if (changed) {
                await supabase
                    .from('products')
                    .update({ metadata: meta })
                    .eq('id', productId)
            }
        }

        // 3. Delete old object from R2
        await deleteFromR2(oldKey)

        // 4. Revalidate
        revalidateProduct(productId)

        return NextResponse.json({ success: true, newUrl })
    } catch (error) {
        console.error('Error renaming image:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al renombrar imagen' },
            { status: 500 }
        )
    }
}
