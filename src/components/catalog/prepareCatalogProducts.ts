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
  return products.map(product => {
    // Sanitize image: if it's a base64 string, drop it.
    let image = product.image
    if (image && image.startsWith('data:')) {
      image = ''
    }

    // Sanitize imageTags: drop any that might be weirdly long or invalid
    // OPTIMIZATION: Merge imageTags into main tags to avoid sending duplicate data.
    // The client filter logic combines them anyway (refer to catalogFiltering.ts).
    const rawImageTags = product.mediaAssets?.flatMap(asset => asset.tags || []) || []

    // Combine and deduplicate
    const combinedTags = Array.from(new Set([...(product.tags || []), ...rawImageTags]))

    return {
      id: product.id,
      name: product.name,
      image,
      price: product.price,
      tags: combinedTags,
      category: product.category,
      sizes: product.sizes || [],
      available: product.available ?? false,
      priority: product.priority ?? DEFAULT_PRODUCT_PRIORITY,
      viewCount: product.viewCount,
      imageTags: [] // Empty this as we merged them into tags
    }
  })
}
