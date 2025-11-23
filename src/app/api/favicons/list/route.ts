import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listR2Objects } from '@/lib/r2'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const objects = await listR2Objects('favicons/')

        return NextResponse.json({
            files: objects.map(obj => ({
                name: obj.key.replace('favicons/', ''),
                url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${obj.key}`,
                size: obj.size,
                lastModified: obj.uploaded
            }))
        })
    } catch (error) {
        console.error('Favicon list error:', error)
        return NextResponse.json(
            { error: 'Failed to list favicons' },
            { status: 500 }
        )
    }
}

export const runtime = 'nodejs'
