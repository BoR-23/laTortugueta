import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { r2Client, R2_BUCKET, DeleteObjectCommand } from '@/lib/r2'

const VARIANT_FOLDERS = ['full', 'medium', 'thumb']

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { assetUrl } = await request.json()

        if (!assetUrl) {
            return NextResponse.json({ error: 'Missing assetUrl' }, { status: 400 })
        }

        // 1. Parse filename
        const oldPath = assetUrl.startsWith('/') ? assetUrl.slice(1) : assetUrl
        const fileName = oldPath.split('/').pop()

        if (!fileName) {
            return NextResponse.json({ error: 'Invalid asset URL' }, { status: 400 })
        }

        // 2. Delete from R2
        if (!r2Client || !R2_BUCKET) {
            throw new Error('R2 configuration missing')
        }

        const deleteFile = async (key: string) => {
            try {
                await r2Client.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: key
                }))
            } catch (err) {
                console.warn(`Failed to delete ${key}`, err)
            }
        }

        // Delete main image
        await deleteFile(oldPath)

        // Delete variants
        await Promise.all(VARIANT_FOLDERS.map(variant => {
            const variantPath = `images/products/_variants/${variant}/${fileName}`
            return deleteFile(variantPath)
        }))

        // 3. Delete from Database
        const client = createSupabaseServerClient()
        const { error: dbError } = await client
            .from('media_assets')
            .delete()
            .eq('url', assetUrl)

        if (dbError) {
            throw new Error(`Database delete failed: ${dbError.message}`)
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting media:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete media' },
            { status: 500 }
        )
    }
}
