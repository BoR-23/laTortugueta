import type { ProductMetadata } from '@/lib/products/types'

export interface AdminProductFormValues {
  id: string
  name: string
  description: string
  category?: string
  type: string
  color: string
  price: number
  priority: number
  tags: string[]
  sizes: string[]
  available: boolean
  gallery: string[]
  metadata: ProductMetadata
  viewCount?: number
}

export interface AdminProductDraftRecord {
  id: string
  values: AdminProductFormValues
  updatedAt: string
  actor?: {
    name?: string | null
    email?: string | null
  }
}
