export interface AdminProductFormValues {
  id: string
  name: string
  description: string
  category: string
  type: string
  color: string
  price: number
  priority: number
  tags: string[]
  sizes: string[]
  available: boolean
  gallery: string[]
  metadata: Record<string, unknown>
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
