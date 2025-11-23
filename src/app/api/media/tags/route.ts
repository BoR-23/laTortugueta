import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    try {
        const { url, tags } = await request.json()

        if (!url || !Array.isArray(tags)) {
            return NextResponse.json({ error: 'URL and tags array are required' }, { status: 400 })
        }

        const supabase = createSupabaseServerClient()

        // We need to find the record by URL.
        // Note: The URL in DB might be relative or absolute.
        // We should try to match exact or relative.

        const { error } = await supabase
            .from('media_assets')
            .update({ tags })
            .eq('url', url)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating tags:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update tags' },
            { status: 500 }
        )
    }
}
