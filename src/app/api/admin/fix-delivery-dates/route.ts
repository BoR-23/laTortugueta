import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export async function GET() {
    const client = createSupabaseServerClient()

    // Fetch all sales
    const { data: sales, error } = await client.from('sales').select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let updatedCount = 0

    for (const sale of sales) {
        let newDeliveryDate = sale.delivery_date
        if (!newDeliveryDate) continue

        const lower = newDeliveryDate.toLowerCase()
        let changed = false

        if (lower.includes('reyes')) {
            newDeliveryDate = '06/01'
            changed = true
        } else if (lower.includes('navidad')) {
            newDeliveryDate = '25/12'
            changed = true
        } else if (lower.includes('enero') && !lower.match(/\d/)) { // Only if no specific date
            newDeliveryDate = '15/01'
            changed = true
        }

        if (changed) {
            await client.from('sales').update({ delivery_date: newDeliveryDate }).eq('id', sale.id)
            updatedCount++
        }
    }

    return NextResponse.json({ message: `Updated ${updatedCount} records` })
}
