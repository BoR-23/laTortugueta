import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  deleteProductRecord,
  getProductData,
  updateProductRecord
} from '@/lib/products'
import { parseProductPayload } from '@/lib/admin/productPayload'
import { recordAdminActivity } from '@/lib/admin/activityLog'
import { revalidateProduct } from '@/lib/revalidation'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await getProductData(id)
    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }
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
    const payload = parseProductPayload(await request.json())
    const product = await updateProductRecord(id, payload)
    revalidateProduct(id)
    await recordAdminActivity({
      action: 'product.update',
      entity: 'product',
      productId: id,
      actor: {
        email: session.user?.email ?? null,
        name: session.user?.name ?? null
      },
      metadata: {
        changedFields: Object.keys(payload).filter(key => key !== 'id'),
        name: product.name
      }
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
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
    await deleteProductRecord(id)
    revalidateProduct(id)
    await recordAdminActivity({
      action: 'product.delete',
      entity: 'product',
      productId: id,
      actor: {
        email: session.user?.email ?? null,
        name: session.user?.name ?? null
      }
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  }
}
