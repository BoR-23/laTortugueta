const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkImageUrls() {
  console.log('\n🔍 Verificando formato de URLs de imágenes en Supabase...\n')

  // Obtener todos los productos
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('❌ Error obteniendo productos:', error)
    return
  }

  console.log(`📦 Total de productos: ${products.length}\n`)

  let totalAssets = 0
  let correctFormat = 0
  let incorrectFormat = 0
  let emptyUrls = 0

  const issues = []

  for (const product of products) {
    const { data: assets } = await supabase
      .from('media_assets')
      .select('id, url, position')
      .eq('product_id', product.id)
      .order('position')

    if (!assets || assets.length === 0) {
      continue
    }

    totalAssets += assets.length

    for (const asset of assets) {
      if (!asset.url || asset.url.trim() === '') {
        emptyUrls++
        issues.push({
          product: product.name,
          productId: product.id,
          assetId: asset.id,
          url: asset.url,
          issue: 'URL vacía'
        })
      } else if (asset.url.startsWith('/images/products/')) {
        correctFormat++
      } else {
        incorrectFormat++
        issues.push({
          product: product.name,
          productId: product.id,
          assetId: asset.id,
          url: asset.url,
          issue: 'Formato incorrecto'
        })
      }
    }
  }

  // Mostrar resumen
  console.log('📊 RESUMEN:\n')
  console.log(`  Total de imágenes: ${totalAssets}`)
  console.log(`  ✅ Formato correcto: ${correctFormat}`)
  console.log(`  ❌ Formato incorrecto: ${incorrectFormat}`)
  console.log(`  ⚠️  URLs vacías: ${emptyUrls}`)

  // Mostrar problemas
  if (issues.length > 0) {
    console.log('\n\n⚠️  PROBLEMAS ENCONTRADOS:\n')
    
    // Mostrar primeros 20 problemas
    const samplesToShow = Math.min(20, issues.length)
    for (let i = 0; i < samplesToShow; i++) {
      const issue = issues[i]
      console.log(`  ${i + 1}. ${issue.product} (${issue.productId})`)
      console.log(`     Issue: ${issue.issue}`)
      console.log(`     URL actual: "${issue.url}"`)
      console.log('')
    }

    if (issues.length > 20) {
      console.log(`  ... y ${issues.length - 20} problemas más\n`)
    }

    console.log('\n💡 RECOMENDACIÓN:')
    console.log('   Ejecuta el script de corrección:')
    console.log('   node scripts/fix_image_urls.js\n')
  } else {
    console.log('\n\n✅ ¡Todas las URLs tienen el formato correcto!\n')
  }
}

checkImageUrls().catch(console.error)
