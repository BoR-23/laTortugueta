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
  metadata?: Record<string, unknown>
}

export type MediaAssetRecord = {
  url: string
  position?: number | null
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
  metadata?: Record<string, unknown>
}

export type MediaAssetInput = {
  url: string
  position?: number
}

export type ProductPriorityUpdate = {
  id: string
  priority: number
}
