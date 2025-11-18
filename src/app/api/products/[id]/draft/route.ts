import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  deleteProductDraft,
  getProductDraft,
  saveProductDraft
} from '@/lib/admin/productDrafts'
import type { AdminProductFormValues } from '@/types/admin'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

const normaliseDraftPayload = (payload: any): AdminProductFormValues => {
  const asObject = typeof payload === 'object' && payload !== null ? payload : {}
  return {
    id: String(asObject.id ?? '').trim(),
    name: String(asObject.name ?? ''),
    description: String(asObject.description ?? ''),
    category: String(asObject.category ?? ''),
    type: String(asObject.type ?? ''),
    color: String(asObject.color ?? ''),
    price: Number(asObject.price ?? 0),
    priority: Number(asObject.priority ?? 0),
    tags: Array.isArray(asObject.tags) ? asObject.tags.map(String) : [],
    sizes: Array.isArray(asObject.sizes) ? asObject.sizes.map(String) : [],
    available: Boolean(asObject.available),
    gallery: Array.isArray(asObject.gallery) ? asObject.gallery.map(String) : [],
    metadata: asObject.metadata && typeof asObject.metadata === 'object' ? asObject.metadata : {}
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const draft = getProductDraft(id)
  if (!draft) {
    return NextResponse.json({ error: 'Borrador no encontrado' }, { status: 404 })
  }
  return NextResponse.json(draft)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { values } = (await request.json()) as { values?: unknown }
    const parsed = normaliseDraftPayload(values)
    if (!id || !parsed.id) {
      return NextResponse.json({ error: 'El borrador necesita un identificador.' }, { status: 400 })
    }
    if (parsed.id !== id) {
      return NextResponse.json(
        { error: 'El identificador del borrador no coincide con la URL.' },
        { status: 400 }
      )
    }

    const record = saveProductDraft({
      values: parsed,
      actor: {
        email: session.user?.email ?? null,
        name: session.user?.name ?? null
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo guardar el borrador.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    deleteProductDraft(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo eliminar el borrador.' }, { status: 500 })
  }
}
