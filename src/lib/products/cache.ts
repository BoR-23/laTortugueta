import fs from 'fs'
import path from 'path'

export const productsDirectory = path.join(process.cwd(), 'data/products')
export const productImagesDirectory = path.join(process.cwd(), 'public/images/products')
export const pricingFilePath = path.join(process.cwd(), 'data/pricing.json')

export const canUseSupabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

let galleryCache: Record<string, string[]> | null = null
let pricingCache: Record<string, number> | null = null

const buildGalleryCache = () => {
  const cache: Record<string, string[]> = {}

  if (!fs.existsSync(productImagesDirectory)) {
    return cache
  }

  const files = fs.readdirSync(productImagesDirectory)

  for (const file of files) {
    const match = file.match(/^(.*?)(?:_(\d+))?\.[^.]+$/)
    if (!match) {
      continue
    }

    const slug = match[1]
    if (!cache[slug]) {
      cache[slug] = []
    }

    cache[slug].push(`/images/products/${file}`)
  }

  Object.keys(cache).forEach(slug => {
    cache[slug].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    )
  })

  return cache
}

export const getProductGallery = (id: string) => {
  if (!galleryCache) {
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
