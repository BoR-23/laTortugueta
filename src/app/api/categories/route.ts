import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import {
  createCategoryRecord,
  getCategories,
  readCategories,
  CategoryScope,
  updateCategoryRecord
} from '@/lib/categories'
import { revalidatePath } from 'next/cache'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope')
  try {
    const categories = await getCategories(scope as CategoryScope | undefined)
    return NextResponse.json(categories)
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
    const payload = await request.json()
    const name = String(payload.name ?? '').trim()
    const scope = String(payload.scope ?? '').trim() as CategoryScope
    const parentId = payload.parentId ? String(payload.parentId) : null
    const tagKey = payload.tagKey ? String(payload.tagKey) : null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (scope !== 'header' && scope !== 'filter') {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
    }

    if (parentId) {
      const all = await readCategories()
      const parent = all.find(category => category.id === parentId)
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }
      if (parent.scope !== scope) {
        return NextResponse.json({ error: 'Parent scope mismatch' }, { status: 400 })
      }
    }

    const record = await createCategoryRecord({
      name,
      scope,
      parentId,
      tagKey
    })
    revalidatePath('/')
    revalidatePath('/admin/categories')
    return NextResponse.json(record)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
