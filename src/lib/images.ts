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

  // Extraer ruta relativa (ej: "3-fonts/3-fonts_1.jpg")
  const relativePath = imagePath.slice(OLD_PRODUCT_IMAGES_BASE.length)

  // Las imágenes en R2 están directamente en /images/products/{producto}/{producto}_1.jpg
  // No hay carpeta _variants, así que usamos las imágenes originales para todas las variantes
  return `${R2_PUBLIC_URL}/images/products/${relativePath}`
}
