import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET() {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = createSupabaseServerClient()
    const { data, error } = await client.from('products').select('tags')
    if (error || !data) {
      throw error || new Error('No data')
    }

    const tagSet = new Set<string>()
    data.forEach(record => {
      if (Array.isArray(record.tags)) {
        record.tags.forEach(tag => {
          if (typeof tag === 'string' && tag.trim().length > 0) {
            tagSet.add(tag.trim())
          }
        })
      }
    })

    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'es'))
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('[tags] fetch failed', error)
    return NextResponse.json({ error: 'No se pudieron listar las etiquetas' }, { status: 500 })
  }
}
