import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateProductPriorities } from '@/lib/products'
import { revalidatePath } from 'next/cache'

const ensureAdmin = async () => {
  const session = await getServerSession(authOptions)
  return session && session.user?.role === 'admin'
}

export async function PUT(request: Request) {
  const isAdmin = await ensureAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { priorities } = (await request.json()) as {
      priorities?: Array<{ id: string; priority: number }>
    }

    if (!Array.isArray(priorities)) {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    await updateProductPriorities(priorities)
    revalidatePath('/')
    revalidatePath('/admin')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'No se pudo actualizar el orden' },
      { status: 500 }
    )
  }
}
