const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixImageUrls() {
  console.log('\n🔧 Corrigiendo URLs de imágenes en Supabase...\n')

  // Obtener todos los assets
  const { data: assets, error } = await supabase
    .from('media_assets')
    .select('id, url, product_id')

  if (error) {
    console.error('❌ Error obteniendo assets:', error)
    return
  }

  console.log(`📦 Total de assets encontrados: ${assets.length}\n`)

  let fixed = 0
  let skipped = 0
  let errors = 0

  for (const asset of assets) {
    let newUrl = asset.url

    // Si la URL está vacía o es null, saltar
    if (!newUrl || newUrl.trim() === '') {
      console.log(`⚠️  Asset ${asset.id} tiene URL vacía, saltando...`)
      skipped++
      continue
    }

    // Si ya tiene el formato correcto, saltar
    if (newUrl.startsWith('/images/products/')) {
      skipped++
      continue
    }

    // Si es una URL completa de R2, extraer solo la ruta
    if (newUrl.includes('r2.dev/')) {
      const match = newUrl.match(/r2\.dev(\/.+)$/)
      if (match) {
        newUrl = match[1]
        console.log(`🔄 Extrayendo ruta de URL R2: ${asset.url} → ${newUrl}`)
      }
    }

    // Si no empieza con /, añadirlo
    if (!newUrl.startsWith('/')) {
      newUrl = '/' + newUrl
    }

    // Si no tiene el prefijo correcto, intentar construirlo
    if (!newUrl.startsWith('/images/products/')) {
      // Extraer solo el nombre del archivo y la carpeta del producto
      const parts = newUrl.split('/')
      const filename = parts[parts.length - 1]
      
      // Intentar encontrar la carpeta del producto en la ruta
      let productFolder = asset.product_id
      const productsIndex = parts.indexOf('products')
      if (productsIndex !== -1 && parts[productsIndex + 1]) {
        productFolder = parts[productsIndex + 1]
      }
      
      newUrl = `/images/products/${productFolder}/${filename}`
      console.log(`🔄 Reconstruyendo ruta: ${asset.url} → ${newUrl}`)
    }

    // Actualizar si cambió
    if (newUrl !== asset.url) {
      const { error: updateError } = await supabase
        .from('media_assets')
        .update({ url: newUrl })
        .eq('id', asset.id)

      if (updateError) {
        console.error(`❌ Error actualizando asset ${asset.id}:`, updateError.message)
        errors++
      } else {
        console.log(`✅ Corregido: ${asset.url} → ${newUrl}`)
        fixed++
      }
    }
  }

  console.log('\n\n📊 RESUMEN:\n')
  console.log(`  ✅ Corregidas: ${fixed}`)
  console.log(`  ⏭️  Sin cambios: ${skipped}`)
  console.log(`  ❌ Errores: ${errors}`)

  if (fixed > 0) {
    console.log('\n\n🎉 ¡URLs corregidas exitosamente!')
    console.log('\n💡 PRÓXIMOS PASOS:')
    console.log('   1. Verifica que las variables de entorno estén en Netlify')
    console.log('   2. Haz un nuevo deploy')
    console.log('   3. Verifica que las imágenes cargan correctamente\n')
  } else if (skipped === assets.length) {
    console.log('\n\n✅ ¡Todas las URLs ya tienen el formato correcto!\n')
  }
}

fixImageUrls().catch(console.error)
