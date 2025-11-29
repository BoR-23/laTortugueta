import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function GET() {
    const client = createSupabaseServerClient()

    // Fetch all sales
    const { data: sales, error } = await client
        .from('sales')
        .select('*')
        .order('date', { ascending: false })

    if (error) {
        // If table doesn't exist yet, return empty stats gracefully
        if (error.code === '42P01') { // undefined_table
            return NextResponse.json({
                topProducts: [],
                salesByMonth: [],
                upcomingDeliveries: [],
                totalOrders: 0
            })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 1. Top Products
    const productCounts: Record<string, number> = {}
    sales.forEach((sale: any) => {
        const name = sale.product_name || 'Desconocido'
        productCounts[name] = (productCounts[name] || 0) + 1
    })

    const topProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    // 2. Sales by Month
    const monthCounts: Record<string, number> = {}
    sales.forEach((sale: any) => {
        if (!sale.date) return
        const d = new Date(sale.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthCounts[key] = (monthCounts[key] || 0) + 1
    })

    const salesByMonth = Object.entries(monthCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

    // 3. Upcoming Deliveries (Simple text based for now, or try to parse)
    // We just return the latest 10 pending orders with delivery dates
    const upcomingDeliveries = sales
        .filter((s: any) => s.delivery_date && s.status !== 'delivered')
        .slice(0, 10)
        .map((s: any) => ({
            id: s.id,
            client: s.client,
            product: s.product_name,
            date: s.delivery_date
        }))

    return NextResponse.json({
        topProducts,
        salesByMonth,
        upcomingDeliveries,
        totalOrders: sales.length
    })
}
