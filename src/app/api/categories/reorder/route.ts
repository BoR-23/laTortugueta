import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

import { authOptions } from '@/lib/auth'
import { readCategories, reorderCategories } from '@/lib/categories'

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
    if (!Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const updates = payload.map(item => ({
      id: String(item.id),
      parentId: item.parentId ? String(item.parentId) : null,
      order: Number(item.order ?? 0)
    }))

    const categories = await readCategories()
    const missing = updates.filter(
      update => !categories.some(category => category.id === update.id)
    )
    if (missing.length) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }

    await reorderCategories(updates)
    revalidatePath('/')
    revalidatePath('/admin/categories')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
