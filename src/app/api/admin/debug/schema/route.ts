import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function GET() {
    const client = createSupabaseServerClient()

    // Fetch one product to see the structure
    const { data, error } = await client
        .from('products')
        .select('*')
        .limit(1)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        keys: data && data[0] ? Object.keys(data[0]) : [],
        sample: data && data[0] ? data[0] : null
    })
}
