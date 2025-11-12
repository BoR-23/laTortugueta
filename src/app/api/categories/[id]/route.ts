import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

import { authOptions } from '@/lib/auth'
import { deleteCategoryRecord, readCategories, updateCategoryRecord } from '@/lib/categories'

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
    const payload = await request.json()
    const name = payload.name ? String(payload.name) : undefined
    const tagKey = payload.tagKey === undefined ? undefined : payload.tagKey ? String(payload.tagKey) : null
    const parentId = payload.parentId === undefined ? undefined : payload.parentId ? String(payload.parentId) : null

    if (parentId !== undefined) {
      const all = await readCategories()
      if (parentId && parentId === id) {
        return NextResponse.json({ error: 'A category cannot be its own parent' }, { status: 400 })
      }
      if (parentId) {
        const parent = all.find(category => category.id === parentId)
        if (!parent) {
          return NextResponse.json({ error: 'Parent not found' }, { status: 400 })
        }
        const current = all.find(category => category.id === id)
        if (current && parent.scope !== current.scope) {
          return NextResponse.json({ error: 'Parent scope mismatch' }, { status: 400 })
        }
        // prevent circular references
        const isDescendant = (targetId: string, searchId: string): boolean => {
          const children = all.filter(category => category.parentId === targetId)
          return children.some(child => child.id === searchId || isDescendant(child.id, searchId))
        }
        if (isDescendant(id, parentId)) {
          return NextResponse.json({ error: 'Cannot assign a child as parent' }, { status: 400 })
        }
      }
    }

    const record = await updateCategoryRecord(id, { name, tagKey, parentId })
    revalidatePath('/')
    revalidatePath('/admin/categories')
    return NextResponse.json(record)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
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
    const result = await deleteCategoryRecord(id)
    revalidatePath('/')
    revalidatePath('/admin/categories')
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
