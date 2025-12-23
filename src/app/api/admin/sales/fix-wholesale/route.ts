
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const client = createSupabaseServerClient()

    // 1. Fetch all sales
    const { data: sales, error: salesError } = await client
        .from('sales')
        .select('*')

    if (salesError || !sales) {
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    // 2. Fetch all products (id, price)
    const { data: products } = await client
        .from('products')
        .select('id, price')

    if (!products) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const updates = []
    let updatedCount = 0

    // 3. Iterate and Check
    for (const sale of sales) {
        const clientName = sale.client || ''
        const details = sale.details || ''
        const isTarget = (clientName.toLowerCase().includes('mayor') || details.toLowerCase().includes('mayor'))

        if (isTarget) {
            // Find linked product base price
            // If product_id is missing, we can't do much (or could try fuzzy match like import, but risky for updates)
            // Let's rely on product_id if present.

            if (sale.product_id) {
                const product = products.find((p: any) => p.id === sale.product_id)
                if (product && product.price) {
                    const correctPrice = product.price * 0.5

                    // Check if it needs update (wrong price OR wrong flag)
                    // Allow small float tolerance ? 
                    const currentPrice = sale.product_price || 0
                    const needsUpdate = (!sale.is_wholesale) || (Math.abs(currentPrice - correctPrice) > 0.05)

                    if (needsUpdate) {
                        updates.push({
                            id: sale.id,
                            is_wholesale: true,
                            product_price: correctPrice
                        })
                        updatedCount++
                    }
                }
            }
        }
    }

    // 4. Perform Updates (Sequentially or Promise.all - Sequential is safer for Supabase limits if many)
    // For batch update, upsert works if we have all fields, but we only have partial.
    // We must loop updates.

    for (const update of updates) {
        await client.from('sales').update({
            is_wholesale: update.is_wholesale,
            product_price: update.product_price
        }).eq('id', update.id)
    }

    return NextResponse.json({
        message: `Corregidos ${updatedCount} pedidos antiguos.`
    })
}
