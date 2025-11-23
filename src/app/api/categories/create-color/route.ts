import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { createCategoryRecord, getCategories } from '@/lib/categories'

export async function POST(request: Request) {
    try {
        const { tagName } = await request.json()

        if (!tagName || !tagName.startsWith('Color')) {
            return NextResponse.json({ error: 'Invalid tag name' }, { status: 400 })
        }

        const client = createSupabaseServerClient()

        // 1. Find the "Colores" parent category
        // We assume it's in the 'filter' scope based on the screenshot
        const { data: parentData, error: parentError } = await client
            .from('categories')
            .select('id')
            .eq('name', 'Colores')
            .eq('scope', 'filter')
            .single()

        if (parentError || !parentData) {
            return NextResponse.json({ error: 'Parent category "Colores" not found' }, { status: 404 })
        }

        const parentId = parentData.id

        // 2. Check if category already exists
        const { data: existingData } = await client
            .from('categories')
            .select('id')
            .eq('tag_key', tagName)
            .single()

        if (existingData) {
            return NextResponse.json({ message: 'Category already exists', id: existingData.id })
        }

        // 3. Create the new category
        // We use the library function to ensure consistency (UUIDs, etc)
        // But we need to make sure we are in a context where we can use it.
        // createCategoryRecord uses 'readCategories' which might be slow if it reads everything.
        // Let's just insert directly for speed if we are sure about the structure, 
        // OR use createCategoryRecord if we want to be safe. 
        // createCategoryRecord is safe.

        const newCategory = await createCategoryRecord({
            name: tagName,
            tagKey: tagName,
            scope: 'filter',
            parentId: parentId
        })

        return NextResponse.json({ success: true, category: newCategory })

    } catch (error) {
        console.error('Error creating color category:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create category' },
            { status: 500 }
        )
    }
}
