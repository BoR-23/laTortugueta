import { NextResponse } from 'next/server'
import { getPricingTable, updateProductPrice } from '@/lib/pricing'

export async function GET() {
  const pricing = await getPricingTable()
  return NextResponse.json(pricing)
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const productId = typeof payload.id === 'string' ? payload.id.trim() : ''
    const priceValue = Number(payload.price)

    if (!productId) {
      return NextResponse.json({ error: 'Falta el identificador del producto.' }, { status: 400 })
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      return NextResponse.json({ error: 'El precio debe ser un número positivo.' }, { status: 400 })
    }

    const pricing = await updateProductPrice(productId, Number(priceValue.toFixed(2)))
    return NextResponse.json({ success: true, pricing })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo actualizar el precio.' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
