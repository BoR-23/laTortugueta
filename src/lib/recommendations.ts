import type { Product } from './products'
import { getAllProducts } from './products'

type Recommendation = {
  id: string
  name: string
  price: number
  image: string
  category?: string
  tags: string[]
  viewCount?: number
}

const COLOR_CODE_REGEX = /^color\s+(\d{3})$/i

const extractColorCodes = (product: Product) =>
  (product.tags || [])
    .map(tag => {
      if (typeof tag !== 'string') return null
      const match = tag.match(COLOR_CODE_REGEX)
      return match ? match[1] : null
    })
    .filter((code): code is string => Boolean(code))

const scoreProduct = (base: Product, candidate: Product) => {
  if (base.id === candidate.id) return 0

  let score = 0

  const baseTags = new Set((base.tags || []).map(tag => String(tag).toLowerCase()))
  const candidateTags = new Set((candidate.tags || []).map(tag => String(tag).toLowerCase()))

  baseTags.forEach(tag => {
    if (candidateTags.has(tag)) {
      score += 3
    }
  })

  if (base.category && candidate.category && base.category === candidate.category) {
    score += 4
  }

  const baseColors = extractColorCodes(base)
  const candidateColors = extractColorCodes(candidate)
  baseColors.forEach(color => {
    if (candidateColors.includes(color)) {
      score += 2
    }
  })

  if (candidate.price && base.price) {
    const priceDiff = Math.abs(candidate.price - base.price)
    if (priceDiff < 5) {
      score += 1
    }
  }

  const viewBoost = candidate.viewCount ? Math.log10(candidate.viewCount + 1) * 2 : 0
  score += viewBoost

  return score
}

export const getRecommendationsForProduct = async (
  productId: string,
  limit = 4
): Promise<Recommendation[]> => {
  const products = await getAllProducts()
  const baseProduct = products.find(product => product.id === productId)
  if (!baseProduct) return []

  return products
    .filter(product => product.id !== productId)
    .map(product => ({
      product,
      score: scoreProduct(baseProduct, product)
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      tags: product.tags || [],
      viewCount: product.viewCount
    }))
}
