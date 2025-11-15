import { NextResponse } from 'next/server'
import sharp from 'sharp'

import { uploadToR2 } from '@/lib/r2'

const VARIANT_SPECS: Record<string, number> = {
  full: 1400,
  medium: 900,
  thumb: 360
}

const MAX_BASE_WIDTH = 2200

const sanitizeFileName = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const productId = String(formData.get('productId') ?? '').trim()
    const file = formData.get('file')

    if (!productId) {
      return NextResponse.json({ error: 'Falta el identificador del producto.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Debes adjuntar un archivo de imagen.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const baseName = sanitizeFileName(file.name) || 'imagen'
    const relativeName = `${productId}-${timestamp}-${baseName}.webp`
    const pipeline = sharp(buffer).rotate()

    const baseBuffer = await pipeline
      .clone()
      .resize({ width: MAX_BASE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const baseKey = `images/products/${relativeName}`
    await uploadToR2(baseKey, baseBuffer, 'image/webp')

    await Promise.all(
      Object.entries(VARIANT_SPECS).map(async ([variant, width]) => {
        const variantBuffer = await pipeline
          .clone()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()
        const variantKey = `images/products/_variants/${variant}/${relativeName}`
        await uploadToR2(variantKey, variantBuffer, 'image/webp')
      })
    )

    const blurBuffer = await pipeline
      .clone()
      .resize({ width: 32, height: 32, fit: 'cover' })
      .webp({ quality: 40 })
      .toBuffer()
    const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`

    return NextResponse.json({ path: `/images/products/${relativeName}`, placeholder: blurDataUrl })
  } catch (error) {
    console.error('[upload] error', error)
    return NextResponse.json({ error: 'No se pudo procesar la imagen.' }, { status: 500 })
  }
}
