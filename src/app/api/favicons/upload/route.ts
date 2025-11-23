import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sharp from 'sharp'
import { uploadToR2 } from '@/lib/r2'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Define all required favicon sizes and formats
        const faviconSpecs = [
            { name: 'favicon-16x16.png', size: 16, format: 'png' as const },
            { name: 'favicon-32x32.png', size: 32, format: 'png' as const },
            { name: 'apple-touch-icon.png', size: 180, format: 'png' as const },
            { name: 'android-chrome-192x192.png', size: 192, format: 'png' as const },
            { name: 'android-chrome-512x512.png', size: 512, format: 'png' as const }
        ]

        const uploadResults: { name: string; url: string }[] = []

        // Generate and upload each size
        for (const spec of faviconSpecs) {
            const processedBuffer = await sharp(buffer)
                .resize(spec.size, spec.size, {
                    fit: 'cover',
                    position: 'center'
                })
                .png()
                .toBuffer()

            const key = `favicons/${spec.name}`
            const url = await uploadToR2(processedBuffer, key, 'image/png')
            uploadResults.push({ name: spec.name, url })
        }

        // Generate favicon.ico (multi-resolution)
        // Note: sharp doesn't natively support .ico, so we'll use 32x32 PNG as fallback
        // For true .ico support, you'd need an additional library like 'to-ico'
        const icoBuffer = await sharp(buffer)
            .resize(32, 32)
            .png()
            .toBuffer()

        const icoKey = 'favicons/favicon.ico'
        const icoUrl = await uploadToR2(icoBuffer, icoKey, 'image/x-icon')
        uploadResults.push({ name: 'favicon.ico', url: icoUrl })

        return NextResponse.json({
            success: true,
            files: uploadResults
        })
    } catch (error) {
        console.error('Favicon upload error:', error)
        return NextResponse.json(
            { error: 'Failed to process and upload favicons' },
            { status: 500 }
        )
    }
}

export const runtime = 'nodejs'
