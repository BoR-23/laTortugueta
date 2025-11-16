import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSiteSettings, updateSiteSettings, type SiteSettings } from '@/lib/settings'
import { revalidateCatalog } from '@/lib/revalidation'

const requireAdmin = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = (await request.json()) as Partial<SiteSettings>
    const settings = await updateSiteSettings(payload)
    revalidateCatalog()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[settings] update error', error)
    return NextResponse.json({ error: 'No se pudieron actualizar los ajustes.' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
