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
  description: string
  sizes?: string[]
  available: boolean
  priority: number
  viewCount?: number
  imagePlaceholder?: string
}

export const prepareCatalogProducts = (products: Product[]): CatalogProductSummary[] => {
  return products.map(product => ({
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    tags: product.tags || [],
    category: product.category,
    description: product.description,
    sizes: product.sizes || [],
    available: product.photos > 0,
    priority: product.priority ?? DEFAULT_PRODUCT_PRIORITY,
    viewCount: product.viewCount,
    imagePlaceholder: extractProductPlaceholderMap(product.metadata)[product.image]
  }))
}
