export type ProductImageVariant = 'original' | 'thumb' | 'medium' | 'full'

const OLD_PRODUCT_IMAGES_BASE = '/images/products/'
const VARIANTS_FOLDER = '_variants'
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

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

  // Extraer ruta relativa (ej: "3-fonts/3-fonts_001.jpg")
  const relativePath = imagePath.slice(OLD_PRODUCT_IMAGES_BASE.length)

  if (variant === 'original') {
    return `${R2_PUBLIC_URL}/images/products/${relativePath}`
  }

  // Las variantes están en /images/products/_variants/{variant}/{producto}/{producto}_001.jpg
  return `${R2_PUBLIC_URL}/images/products/${VARIANTS_FOLDER}/${variant}/${relativePath}`
}
