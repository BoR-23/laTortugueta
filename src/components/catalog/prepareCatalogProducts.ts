import type { Product } from '@/lib/products'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'
import { extractProductPlaceholderMap } from '@/lib/images'

export type CatalogProductSummary = {
  id: string
  name: string
  image: string
  price: number
  tags: string[]
  category?: string
  sizes?: string[]
  available: boolean
  priority: number
  viewCount?: number
  imageTags?: string[]
}

export const prepareCatalogProducts = (products: Product[]): CatalogProductSummary[] => {
  return products.map(product => ({
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    tags: product.tags || [],
    category: product.category,
    sizes: product.sizes || [],
    available: product.available ?? false,
    priority: product.priority ?? DEFAULT_PRODUCT_PRIORITY,
    viewCount: product.viewCount,
    imageTags: product.mediaAssets?.flatMap(asset => asset.tags || []) || []
  }))
}
