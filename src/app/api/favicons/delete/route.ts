import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const fileName = searchParams.get('file')

        if (!fileName) {
            return NextResponse.json({ error: 'File name required' }, { status: 400 })
        }

        const key = `favicons/${fileName}`
        await deleteFromR2(key)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Favicon delete error:', error)
        return NextResponse.json(
            { error: 'Failed to delete favicon' },
            { status: 500 }
        )
    }
}

export const runtime = 'nodejs'
