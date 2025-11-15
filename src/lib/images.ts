export type ProductImageVariant = 'original' | 'thumb' | 'medium' | 'full'

const OLD_PRODUCT_IMAGES_BASE = '/images/products/'
const VARIANTS_FOLDER = '_variants'
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

export type ProductPlaceholderMap = Record<string, string>

const normalisePlaceholderEntries = (input: unknown): ProductPlaceholderMap => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const result: ProductPlaceholderMap = {}
  Object.entries(input as Record<string, unknown>).forEach(([url, value]) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      result[url] = value
    }
  })
  return result
}

export const extractProductPlaceholderMap = (
  metadata?: Record<string, unknown> | null
): ProductPlaceholderMap => {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const candidate = (metadata as { imagePlaceholders?: unknown }).imagePlaceholders
  return normalisePlaceholderEntries(candidate)
}

export const buildProductPlaceholderMap = (
  gallery: string[],
  current: ProductPlaceholderMap,
  additions: ProductPlaceholderMap = {}
): ProductPlaceholderMap => {
  const allowed = new Set(gallery)
  const merged = { ...current, ...additions }
  const next: ProductPlaceholderMap = {}
  Object.entries(merged).forEach(([url, value]) => {
    if (allowed.has(url) && value) {
      next[url] = value
    }
  })
  return next
}

export const getImagePlaceholder = (
  placeholders?: ProductPlaceholderMap,
  imagePath?: string | null
) => {
  if (!placeholders || !imagePath) {
    return undefined
  }
  return placeholders[imagePath]
}

export const getProductImageVariant = (
  imagePath: string | undefined | null,
  variant: ProductImageVariant = 'original'
) => {
  if (!imagePath) {
    return ''
  }

  // Si no es una imagen de producto, devolverla tal cual
  if (!imagePath.startsWith(OLD_PRODUCT_IMAGES_BASE)) {
    return imagePath
  }

  // Si no tenemos R2 configurado (desarrollo sin .env), usar ruta local
  if (!R2_PUBLIC_URL) {
    console.warn('R2_PUBLIC_URL not configured, using local images')
    return imagePath
  }

  // Extraer nombre del archivo (ej: "3-fonts_001.jpg")
  // Las imágenes están directamente en /images/products/ sin carpeta de producto
  const relativePath = imagePath.slice(OLD_PRODUCT_IMAGES_BASE.length)

  if (variant === 'original') {
    return `${R2_PUBLIC_URL}/images/products/${relativePath}`
  }

  // Las variantes están en /images/products/_variants/{variant}/producto_001.jpg
  return `${R2_PUBLIC_URL}/images/products/${VARIANTS_FOLDER}/${variant}/${relativePath}`
}
