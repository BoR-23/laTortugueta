import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createProductRecord, getProductData } from '@/lib/products'
import { sanitizeTypeMetadata } from '@/lib/productTypes'

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Split accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, '') // Trim - from end
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { variant } = await request.json() // 'exact', 'bordado', 'con-letra', 'con-dos-letras'
        const resolvedParams = await params
        const sourceProduct = await getProductData(resolvedParams.id)

        if (!sourceProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        let newName = sourceProduct.name
        let newTags = [...sourceProduct.tags]
        let suffix = ''

        if (variant === 'bordado') {
            suffix = ' Bordado'
            if (!newTags.includes('Bordado')) newTags.push('Bordado')
        } else if (variant === 'con-letra') {
            suffix = ' con Letra'
            if (!newTags.includes('Con Letra')) newTags.push('Con Letra')
        } else if (variant === 'con-dos-letras') {
            suffix = ' con dos Letras'
            if (!newTags.includes('Con dos Letras')) newTags.push('Con dos Letras')
        } else {
            suffix = ' (Copia)'
        }

        newName = `${newName}${suffix}`

        // Generate SEO-friendly slug
        const baseSlug = slugify(newName)
        const randomSuffix = Math.random().toString(36).substring(2, 6)
        const newId = `${baseSlug}-${randomSuffix}`

        // Create new product payload
        // We explicitly DO NOT copy the gallery/photos as requested
        const newProductPayload = {
            id: newId,
            name: newName,
            description: sourceProduct.description,
            category: sourceProduct.category,
            type: sourceProduct.type,
            color: sourceProduct.color,
            price: sourceProduct.price,
            priority: sourceProduct.priority, // Keep same priority or maybe add 1? Let's keep same.
            tags: newTags,
            sizes: sourceProduct.sizes,
            available: false, // Start as draft/unavailable
            material: sourceProduct.material,
            care: sourceProduct.care,
            origin: sourceProduct.origin,
            metadata: sanitizeTypeMetadata(sourceProduct.type, sourceProduct.metadata || {})
        }

        const newProduct = await createProductRecord(newProductPayload)

        return NextResponse.json(newProduct)
    } catch (error) {
        console.error('Error duplicating product:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to duplicate product' },
            { status: 500 }
        )
    }
}
