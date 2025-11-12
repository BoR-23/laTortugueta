// Contenido completo para src/lib/images.ts

export type ProductImageVariant = 'original' | 'thumb' | 'medium' | 'full'

const OLD_PRODUCT_IMAGES_BASE = '/images/products/'
const VARIANTS_FOLDER = '_variants'
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

export const getProductImageVariant = (
  imagePath: string | undefined | null,
  variant: ProductImageVariant = 'original'
) => {
  if (!imagePath) {
    return ''
  }

  // Si no es una imagen de producto (no empieza con la ruta antigua), devolverla tal cual.
  if (!imagePath.startsWith(OLD_PRODUCT_IMAGES_BASE)) {
    return imagePath
  }

  // Si no tenemos la URL de R2 (ej. en 'npm run dev'), devolvemos la ruta local.
  if (!R2_BASE_URL) {
    return imagePath
  }

  // Extrae la ruta relativa (ej: "xulilla/foto.jpg")
  const relativePath = imagePath.slice(OLD_PRODUCT_IMAGES_BASE.length)

  // Asumiendo que en R2 subiste el contenido de 'public' manteniendo la estructura,
  // la ruta de las imágenes de producto es: [R2_BASE_URL]/images/products/...

  if (variant === 'original') {
    // Devuelve: https://...r2.dev/images/products/xulilla/foto.jpg
    return `${R2_BASE_URL}/images/products/${relativePath}`
  }

  // Devuelve: https://...r2.dev/images/products/_variants/thumb/xulilla/foto.jpg
  return `${R2_BASE_URL}/images/products/${VARIANTS_FOLDER}/${variant}/${relativePath}`
}
