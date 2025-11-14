#!/usr/bin/env node
/**
 * Popula la tabla media_assets basándose en la información de los archivos markdown
 * Las imágenes están en R2, así que creamos las referencias con el formato correcto
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

const productsDir = path.join(__dirname, '..', 'data', 'products')

const readMarkdownProducts = () => {
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.md'))
  return files.map(file => {
    const id = file.replace(/\.md$/, '')
    const fullPath = path.join(productsDir, file)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data } = matter(fileContents)
    return { id, data }
  })
}

const inferImageExtension = data => {
  if (data && typeof data.image === 'string') {
    const ext = path.extname(data.image).toLowerCase()
    if (ext) {
      return ext
    }
  }

  return '.jpg'
}

const populateMediaAssets = async () => {
  const entries = readMarkdownProducts()
  console.log(`\n🔄 Procesando ${entries.length} productos...\n`)

  let totalAdded = 0
  let productsWithPhotos = 0
  let productsWithoutPhotos = 0

  for (const entry of entries) {
    const { id, data } = entry
    
    // Obtener el número de fotos del markdown
    const photoCount = typeof data.photos === 'number' ? data.photos : 0
    const extension = inferImageExtension(data)
    
    if (photoCount === 0) {
      productsWithoutPhotos++
      continue
    }

    // Crear las referencias a las imágenes en R2
    // Las imágenes en R2 están directamente sin carpeta: /images/products/producto_001.jpg
    const mediaAssets = []
    for (let i = 1; i <= photoCount; i++) {
      const paddedNumber = String(i).padStart(3, '0') // 1 -> 001, 2 -> 002, etc.
      mediaAssets.push({
        product_id: id,
        url: `/images/products/${id}_${paddedNumber}${extension}`,
        position: i - 1
      })
    }

    // Eliminar assets existentes para este producto
    await supabase.from('media_assets').delete().eq('product_id', id)

    // Insertar los nuevos assets
    const { error } = await supabase.from('media_assets').insert(mediaAssets)
    
    if (error) {
      console.error(`❌ Error insertando assets para ${id}:`, error.message)
    } else {
      console.log(`✅ ${id}: ${photoCount} fotos`)
      totalAdded += photoCount
      productsWithPhotos++
    }
  }

  console.log('\n\n📊 RESUMEN:\n')
  console.log(`  Total de productos procesados: ${entries.length}`)
  console.log(`  Productos con fotos: ${productsWithPhotos}`)
  console.log(`  Productos sin fotos: ${productsWithoutPhotos}`)
  console.log(`  Total de assets creados: ${totalAdded}`)
  
  console.log('\n\n✅ ¡Media assets poblados exitosamente!')
  console.log('\n💡 PRÓXIMOS PASOS:')
  console.log('   1. Verifica que las variables de entorno estén en Netlify')
  console.log('   2. Haz un nuevo deploy')
  console.log('   3. Las imágenes deberían cargarse desde R2 correctamente\n')
}

populateMediaAssets().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
