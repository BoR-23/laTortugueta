import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

import { authOptions } from '@/lib/auth'
import { updateProductTags } from '@/lib/products'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
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
    const payload = await request.json().catch(() => ({}))
    const tags = Array.isArray(payload.tags) ? payload.tags : []
    const updated = await updateProductTags(
      id,
      tags.map(tag => (typeof tag === 'string' ? tag : String(tag ?? '')))
    )

    revalidatePath('/')
    revalidatePath(`/${id}`)
    revalidatePath('/admin')

    return NextResponse.json({ ok: true, tags: updated })
  } catch (error) {
    console.error('[tags] update failed', error)
    return NextResponse.json({ error: 'No se pudieron actualizar los tags' }, { status: 500 })
  }
}
