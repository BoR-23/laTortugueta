import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabaseClient'

type Payload = {
  productId?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload
    const productId = typeof body.productId === 'string' ? body.productId.trim() : ''

    if (!productId) {
      return NextResponse.json({ error: 'Falta el identificador del producto.' }, { status: 400 })
    }

    const client = createSupabaseServerClient()
    const { error } = await client.rpc('increment_product_view', { p_product_id: productId })

    if (error) {
      console.error('[analytics] increment_product_view', error)
      return NextResponse.json({ error: 'No se pudo registrar la vista.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[analytics] payload error', error)
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }
}

export const dynamic = 'force-dynamic'
