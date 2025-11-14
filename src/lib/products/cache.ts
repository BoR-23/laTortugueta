import fs from 'fs'
import path from 'path'

export const productsDirectory = path.join(process.cwd(), 'data/products')
export const productImagesDirectory = path.join(process.cwd(), 'public/images/products')
export const pricingFilePath = path.join(process.cwd(), 'data/pricing.json')

export const canUseSupabase =
  process.env.NETLIFY
    ? true // En Netlify SIEMPRE usar Supabase
    : Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

let galleryCache: Record<string, string[]> | null = null
let pricingCache: Record<string, number> | null = null

const buildGalleryCache = () => {
  console.log('--- 🔍 INICIO ESCANEO DE IMÁGENES (Debug) ---')
  const cache: Record<string, string[]> = {}

  if (!fs.existsSync(productImagesDirectory)) {
    console.warn('⚠️ La carpeta de imágenes NO existe:', productImagesDirectory)
    return cache
  }

  const files = fs.readdirSync(productImagesDirectory)
  console.log(`📂 Archivos encontrados en disco: ${files.length}`)

  for (const file of files) {
    // Ignoramos archivos ocultos o que no sean imágenes
    if (file.startsWith('.') || !/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      continue
    }

    // Lógica BLINDADA para sacar el slug:
    // 1. Quitamos la extensión (.jpg)
    // 2. Quitamos el sufijo de número (_001) si existe al final
    const slug = file
      .replace(/\.[^/.]+$/, '') // Quita extensión
      .replace(/_\\d+$/, '')     // Quita _001, _002, etc.

    if (!cache[slug]) {
      cache[slug] = []
    }

    cache[slug].push(`/images/products/${file}`)
  }

  // Reporte de diagnóstico rápido
  const totalKeys = Object.keys(cache).length
  console.log(`✅ Productos identificados con fotos: ${totalKeys}`)
  if (files.length > 0 && totalKeys === 0) {
    console.error('❌ ERROR: Hay archivos pero no se han asignado a ningún producto. Revisa los nombres.')
    console.log('Ejemplo de archivo:', files[0])
  } else if (cache['3-fonts']) {
    console.log('🎉 ÉXITO: Fotos detectadas para \"3-fonts\":', cache['3-fonts'].length)
  }
  console.log('--- FIN ESCANEO ---')

  // Ordenar alfabéticamente las fotos de cada producto
  Object.keys(cache).forEach(slug => {
    cache[slug].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    )
  })

  return cache
}

export const getProductGallery = (id: string) => {
  // Si la caché está vacía, forzamos un re-escaneo (útil en dev)
  if (!galleryCache || Object.keys(galleryCache).length === 0) {
    galleryCache = buildGalleryCache()
  }

  return galleryCache[id] ? [...galleryCache[id]] : []
}

export const getPricingTable = () => {
  if (canUseSupabase) {
    return {}
  }

  if (!pricingCache) {
    try {
      const fileContents = fs.readFileSync(pricingFilePath, 'utf8')
      pricingCache = JSON.parse(fileContents) as Record<string, number>
    } catch {
      pricingCache = {}
    }
  }

  return pricingCache
}

export const clearProductCaches = () => {
  galleryCache = null
  pricingCache = null
}

export const ensureProductsDirectory = () => {
  if (!fs.existsSync(productsDirectory)) {
    fs.mkdirSync(productsDirectory, { recursive: true })
  }
}
