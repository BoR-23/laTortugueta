#!/usr/bin/env node
/**
 * Genera blur placeholders para todas las imágenes de productos que aún no lo tengan
 * y actualiza metadata.imagePlaceholders en Supabase.
 *
 * Requisitos:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY (solo se usa desde el script)
 *  - NEXT_PUBLIC_R2_PUBLIC_URL o R2_PUBLIC_URL para resolver las rutas /images/products/...
 */

const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sharp = require('sharp')

const envPaths = [
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '..', '.env')
]

envPaths.forEach(envPath => {
  try {
    require('dotenv').config({ path: envPath })
  } catch {
    // ignoramos rutas que no existan
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || ''

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

const fetchImpl = async (...args) => {
  if (typeof fetch !== 'undefined') {
    return fetch(...args)
  }
  const { default: nodeFetch } = await import('node-fetch')
  return nodeFetch(...args)
}

const normaliseBase = value => (value || '').replace(/\/$/, '')

const toAbsoluteUrl = url => {
  if (!url) {
    return null
  }
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  if (url.startsWith('/')) {
    if (!r2PublicUrl) {
      throw new Error(`No se puede resolver la ruta relativa ${url} sin NEXT_PUBLIC_R2_PUBLIC_URL`)
    }
    return `${normaliseBase(r2PublicUrl)}${url}`
  }
  return url
}

const fetchBuffer = async url => {
  const absolute = toAbsoluteUrl(url)
  if (!absolute) {
    throw new Error('URL no válida')
  }
  const response = await fetchImpl(absolute)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

const buildBlurPlaceholder = async buffer => {
  const blurBuffer = await sharp(buffer)
    .resize(24, 24, { fit: 'cover' })
    .webp({ quality: 40 })
    .toBuffer()
  return `data:image/webp;base64,${blurBuffer.toString('base64')}`
}

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const run = async () => {
  console.log('Buscando productos sin placeholders...')
  const { data: products, error } = await supabase
    .from('products')
    .select('id, metadata, media_assets(url, position)')
    .order('id', { ascending: true })

  if (error) {
    console.error('No se pudieron obtener los productos', error)
    process.exit(1)
  }

  let totalProcessed = 0
  let totalUpdated = 0
  let totalPlaceholders = 0

  for (const product of products) {
    totalProcessed += 1
    const metadata = isObject(product.metadata) ? { ...product.metadata } : {}
    const existingPlaceholders = isObject(metadata.imagePlaceholders)
      ? { ...metadata.imagePlaceholders }
      : {}

    const gallery = Array.isArray(product.media_assets)
      ? [...product.media_assets]
          .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
          .map(asset => asset?.url)
          .filter(Boolean)
      : []

    const uniqueUrls = Array.from(new Set(gallery.filter(url => typeof url === 'string' && url.length > 0)))

    const placeholdersToAdd = {}

    for (const url of uniqueUrls) {
      if (existingPlaceholders[url]) {
        continue
      }
      try {
        const buffer = await fetchBuffer(url)
        const placeholder = await buildBlurPlaceholder(buffer)
        placeholdersToAdd[url] = placeholder
        totalPlaceholders += 1
        console.log(`✓ ${product.id}: placeholder generado para ${url}`)
      } catch (err) {
        console.warn(`⚠️  ${product.id}: no se pudo generar placeholder para ${url} (${err.message})`)
      }
    }

    if (Object.keys(placeholdersToAdd).length === 0) {
      continue
    }

    metadata.imagePlaceholders = { ...existingPlaceholders, ...placeholdersToAdd }
    const { error: updateError } = await supabase
      .from('products')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', product.id)

    if (updateError) {
      console.error(`✗ ${product.id}: error al actualizar metadata`, updateError)
      continue
    }

    totalUpdated += 1
  }

  console.log('---')
  console.log(`Productos revisados: ${totalProcessed}`)
  console.log(`Productos actualizados: ${totalUpdated}`)
  console.log(`Placeholders generados: ${totalPlaceholders}`)
}

run().catch(error => {
  console.error('Script interrumpido', error)
  process.exit(1)
})
