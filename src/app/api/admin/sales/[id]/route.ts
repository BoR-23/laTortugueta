import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params
    const {
        order_id,
        date,
        client: client_name, // Renamed to avoid conflict with supabase client
        product_name,
        size,
        details,
        delivery_date,
        status,
        is_wholesale
    } = await request.json()

    const client = createSupabaseServerClient()

    const { error } = await client
        .from('sales')
        .update({
            order_id,
            date,
            client: client_name,
            product_name,
            size,
            details,
            delivery_date,
            status,
            is_wholesale
        })
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sale updated successfully' })
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params
    const client = createSupabaseServerClient()

    const { error } = await client
        .from('sales')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sale deleted successfully' })
}
