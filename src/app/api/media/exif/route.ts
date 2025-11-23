import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import exifr from 'exifr'
import { r2Client, R2_BUCKET } from '@/lib/r2'

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // Extract key from URL if it's a full URL, or use it as is if it's a path
        // Assuming the URL stored in DB is like "/images/products/..." which matches the key structure in R2 usually
        // But sometimes it might be a full URL.
        // Based on inspect_exif_data.js, keys are like "images/products/..."
        // And DB urls are like "/images/products/..."

        let key = url
        if (key.startsWith('/')) {
            key = key.substring(1)
        }

        // If it's a full URL, try to extract the path
        if (key.startsWith('http')) {
            try {
                const u = new URL(key)
                key = u.pathname.substring(1) // remove leading slash
            } catch (e) {
                // ignore
            }
        }

        if (!r2Client) {
            throw new Error('R2 client is not configured')
        }

        const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key
        })

        const { Body } = await r2Client.send(getCommand)

        // Convert stream to buffer
        const chunks = []
        // @ts-ignore
        for await (const chunk of Body) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)

        const exif = await exifr.parse(buffer, {
            tiff: true,
            exif: true,
            gps: false,
            interop: false,
            // @ts-ignore
            ifd0: true,
            ifd1: false
        } as any)

        return NextResponse.json({ exif })
    } catch (error) {
        console.error('Error fetching EXIF:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch EXIF' },
            { status: 500 }
        )
    }
}
