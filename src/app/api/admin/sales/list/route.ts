import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export async function GET() {
  const client = createSupabaseServerClient()

  // Fetch sales joined with products to get image and price
  // Supabase join syntax: select('*, products(image, price)')
  const { data: sales, error } = await client
    .from('sales')
    .select(`
      *,
      products (
        price,
        media_assets (
          url,
          position
        )
      )
    `)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the structure for easier frontend consumption
  const formattedSales = sales.map((sale: any) => {
    const assets = sale.products?.media_assets || []
    // Sort by position to get the main image (usually position 0 or 1)
    assets.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    const image = assets.length > 0 ? assets[0].url : null

    return {
      ...sale,
      product_image: image,
      product_price: sale.products?.price || null
    }
  })

  // Sort by order_id numerically (descending)
  // order_id format is usually ".1234", so we remove the dot and parse int
  formattedSales.sort((a: any, b: any) => {
    const idA = parseInt(a.order_id?.replace('.', '') || '0')
    const idB = parseInt(b.order_id?.replace('.', '') || '0')
    return idB - idA
  })

  return NextResponse.json(formattedSales)
}
