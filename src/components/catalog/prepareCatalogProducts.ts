import type { Product } from '@/lib/products'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'

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
    viewCount: product.viewCount
  }))
}
