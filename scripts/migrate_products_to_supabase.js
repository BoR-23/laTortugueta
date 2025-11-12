#!/usr/bin/env node
/**
 * Migrates the current markdown-based catalog to Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

const productsDir = path.join(__dirname, '..', 'data', 'products')
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const readMarkdownProducts = () => {
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.md'))
  return files.map(file => {
    const id = file.replace(/\.md$/, '')
    const fullPath = path.join(productsDir, file)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return { id, data, content }
  })
}

const DEFAULT_PRIORITY = 1000

const buildProductPayload = (entry, gallery) => {
  const { data, content } = entry
  const priorityValue =
    typeof data.priority === 'number' ? data.priority : Number(data.priority ?? DEFAULT_PRIORITY)
  return {
    id: entry.id,
    name: data.name || entry.id,
    description: content.trim(),
    price: Number(data.price) || 0,
    color: data.color || '',
    type: data.type || '',
    material: data.material || '',
    care: data.care || '',
    origin: data.origin || '',
    category: data.category || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    photos: gallery.length,
    available: gallery.length > 0,
    metadata: data.metadata || {},
    priority: Number.isFinite(priorityValue) ? priorityValue : DEFAULT_PRIORITY
  }
}

const getGalleryForSlug = slug => {
  if (!fs.existsSync(imagesDir)) return []
  return fs
    .readdirSync(imagesDir)
    .filter(file => file.startsWith(`${slug}_`))
    .sort()
    .map((file, index) => ({
      url: `/images/products/${file}`,
      position: index
    }))
}

const migrate = async () => {
  const entries = readMarkdownProducts()
  console.log(`Migrating ${entries.length} products to Supabase...`)

  for (const entry of entries) {
    const gallery = getGalleryForSlug(entry.id)
    const payload = buildProductPayload(entry, gallery)

    const { error: productError } = await supabase.from('products').upsert(payload)
    if (productError) {
      console.error(`Failed to upsert product ${entry.id}`, productError)
      continue
    }

    if (gallery.length > 0) {
      await supabase.from('media_assets').delete().eq('product_id', entry.id)
      const { error: mediaError } = await supabase.from('media_assets').insert(
        gallery.map(item => ({
          product_id: entry.id,
          url: item.url,
          position: item.position
        }))
      )
      if (mediaError) {
        console.error(`Failed to sync gallery for ${entry.id}`, mediaError)
      }
    }
    console.log(`→ ${entry.id} (${gallery.length} fotos)`)
  }

  console.log('Done. Recuerda revisar Supabase Storage para subir las imágenes reales.')
}

migrate().catch(error => {
  console.error('Migration failed', error)
  process.exit(1)
})
