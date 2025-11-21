import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/products'

export async function GET() {
    try {
        const products = await getAllProducts()
        const debugData = products.map(p => ({
            id: p.id,
            name: p.name,
            tags: p.tags,
            available: p.available,
            price: p.price,
            matchesDeHome: (p.tags || []).some(t => t.toLowerCase().trim() === 'de home')
        })).filter(p => p.matchesDeHome)

        return NextResponse.json({
            count: debugData.length,
            products: debugData
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
