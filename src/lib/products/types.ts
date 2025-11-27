export type ImagePlaceholderMap = Record<string, string>

export type ProductMetadata = {
  storyTitle?: string
  storyOrigin?: string
  storyCost?: string
  storyBody?: string
  storyImages?: string[] | string
  imagePlaceholders?: ImagePlaceholderMap
  imageReview?: Record<string, boolean>
} & Record<string, unknown>

export interface Product {
  id: string
  name: string
  color: string
  type: string
  price: number
  priority?: number
  image: string
  description: string
  tags: string[]
  material: string
  care: string
  origin: string
  content: string
  category?: string
  photos: number
  gallery: string[]
  sizes?: string[]
  available?: boolean
  metadata?: ProductMetadata
  viewCount?: number
  updatedAt?: string
  mediaAssets?: MediaAssetRecord[]
}

export type MediaAssetRecord = {
  url: string
  position?: number | null
  tags?: string[]
}

export type ProductMutationInput = {
  id: string
  name: string
  description: string
  category?: string
  priority?: number
  color?: string
  price?: number
  tags?: string[]
  sizes?: string[]
  available?: boolean
  type?: string
  material?: string
  care?: string
  origin?: string
  metadata?: ProductMetadata
}

export type MediaAssetInput = {
  url: string
  position?: number
  tags?: string[]
}

export type ProductPriorityUpdate = {
  id: string
  priority: number
}
