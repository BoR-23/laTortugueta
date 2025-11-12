import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { replaceProductMediaAssets, MediaAssetInput } from '@/lib/products'
import { revalidatePath } from 'next/cache'

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
    const assets = Array.isArray(payload.assets)
      ? (payload.assets as MediaAssetInput[])
      : []

    await replaceProductMediaAssets(id, assets)

    revalidatePath('/')
    revalidatePath(`/${id}`)
    revalidatePath('/admin')

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo actualizar la galer\u00eda' }, { status: 500 })
  }
}
