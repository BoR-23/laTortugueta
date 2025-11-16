import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { revalidateCatalog } from '@/lib/revalidation'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const targetId = typeof payload.targetId === 'string' ? payload.targetId.trim() : ''
    const sourceIds = Array.isArray(payload.sourceIds)
      ? payload.sourceIds.map((value: unknown) => String(value).trim()).filter(Boolean)
      : []

    if (!targetId || sourceIds.length === 0) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    if (sourceIds.includes(targetId)) {
      return NextResponse.json(
        { error: 'La categoría destino no puede formar parte del listado a fusionar.' },
        { status: 400 }
      )
    }

    const client = createSupabaseServerClient()
    const { error } = await client.rpc('merge_categories', {
      target_category_id: targetId,
      source_category_ids: sourceIds
    })

    if (error) {
      throw new Error(error.message)
    }

    await revalidateCatalog()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[categories.merge] error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo fusionar las categorías.' },
      { status: 500 }
    )
  }
}
