import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createProductRecord, getAllProducts } from '@/lib/products'
import { revalidatePath } from 'next/cache'
import { parseProductPayload } from '@/lib/admin/productPayload'
import { recordAdminActivity } from '@/lib/admin/activityLog'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET() {
  try {
    const products = await getAllProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = parseProductPayload(await request.json())
    const product = await createProductRecord(payload)
    revalidatePath('/')
    revalidatePath(`/${product.id}`)
    revalidatePath('/admin')
    await recordAdminActivity({
      action: 'product.create',
      entity: 'product',
      productId: product.id,
      actor: {
        email: session.user?.email ?? null,
        name: session.user?.name ?? null
      },
      metadata: {
        name: product.name,
        price: product.price,
        tags: product.tags ?? []
      }
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
