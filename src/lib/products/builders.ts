import { DEFAULT_PRODUCT_PRIORITY } from '../productDefaults'
import { DEFAULT_PRODUCT_TYPE, sanitizeTypeMetadata } from '../productTypes'
import { inferProductTypeFromCategory } from '../categoryMappings'

import type { Product, ProductMutationInput, MediaAssetRecord, ProductMetadata } from './types'

export const toStringArray = (value?: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item).trim()).filter(Boolean)
}

export const normalisePriority = (value?: unknown) => {
  const numericValue =
    typeof value === 'number' ? value : Number(typeof value === 'string' ? value.trim() : value)
  return Number.isFinite(numericValue) ? numericValue : DEFAULT_PRODUCT_PRIORITY
}

export const compareByPriority = (a: Product, b: Product) => {
  const diff = normalisePriority(a.priority) - normalisePriority(b.priority)
  if (diff !== 0) {
    return diff
  }
  return a.name.localeCompare(b.name, 'es')
}

export const sanitiseProductInput = (input: ProductMutationInput) => {
  const priceValue = Number(input.price ?? 0)
  const typeValue =
    typeof input.type === 'string' && input.type.trim().length > 0
      ? input.type.trim()
      : inferProductTypeFromCategory(input.category)
  const metadataValue = sanitizeTypeMetadata(typeValue, input.metadata ?? {}) as ProductMetadata
  return {
    ...input,
    id: input.id.trim(),
    name: input.name.trim(),
    description: input.description ?? '',
    price: Number.isFinite(priceValue) ? Number(priceValue.toFixed(2)) : 0,
    tags: toStringArray(input.tags),
    sizes: toStringArray(input.sizes),
    available: Boolean(input.available),
    priority: normalisePriority(input.priority),
    type: typeValue,
    metadata: metadataValue,
    category: typeof input.category === 'string' ? input.category.trim() : undefined
  }
}

export const supabasePayloadFromInput = (input: ProductMutationInput, withTimestamps = true) => {
  const now = new Date().toISOString()
  const payload = {
    id: input.id,
    name: input.name,
    description: input.description,
    price: input.price ?? 0,
    color: input.color ?? '',
    tags: input.tags ?? [],
    sizes: input.sizes ?? [],
    available: input.available ?? false,
    type: input.type ?? '',
    material: input.material ?? '',
    care: input.care ?? '',
    origin: input.origin ?? '',
    metadata: input.metadata ?? {},
    priority: input.priority ?? DEFAULT_PRODUCT_PRIORITY
  } as Record<string, unknown>

  if (withTimestamps) {
    payload.updated_at = now
  }

  return payload
}
const deriveCategoryName = (tags: unknown, lookup?: Map<string, string>) => {
  if (!lookup || !Array.isArray(tags)) {
    return undefined
  }
  for (const tag of tags) {
    if (typeof tag !== 'string') continue
    const trimmed = tag.trim()
    if (!trimmed) continue
    const match = lookup.get(trimmed)
    if (match) {
      return match
    }
  }
  return undefined
}

export const buildProductFromSupabase = (
  record: Record<string, any>,
  categoryLookup?: Map<string, string>
): Product => {
  // Las URLs vienen de Supabase como rutas locales (/images/products/...)
  // Las dejamos así porque getProductImageVariant las convertirá a R2 cuando sea necesario
  const gallery = Array.isArray(record.media_assets)
    ? (record.media_assets as MediaAssetRecord[])
        .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
        .map(asset => asset.url)
    : []

  const categoryFromTags = deriveCategoryName(record.tags, categoryLookup)
  const explicitCategory =
    typeof record.category === 'string' && record.category.trim().length > 0
      ? record.category.trim()
      : undefined
  const categoryName = categoryFromTags ?? explicitCategory

  const baseType =
    typeof record.type === 'string' && record.type.trim().length > 0
      ? record.type.trim()
      : inferProductTypeFromCategory(categoryName)

  const metadata =
    record.metadata && typeof record.metadata === 'object'
      ? (record.metadata as Record<string, unknown>)
      : {}

  return {
    id: record.id,
    name: record.name,
    color: record.color || '',
    type: baseType || DEFAULT_PRODUCT_TYPE,
    price: Number(record.price) || 0,
    image: gallery[0] || '',
    description: record.description || '',
    tags: Array.isArray(record.tags) ? record.tags : [],
    material: record.material || '',
    care: record.care || '',
    origin: record.origin || '',
    content: record.description || '',
    category: categoryName,
    photos: record.photos || gallery.length,
    gallery,
    sizes: Array.isArray(record.sizes) ? record.sizes : undefined,
    available: typeof record.available === 'boolean' ? record.available : gallery.length > 0,
    metadata: sanitizeTypeMetadata(baseType || DEFAULT_PRODUCT_TYPE, metadata) as ProductMetadata,
    priority: normalisePriority(record.priority),
    viewCount: typeof record.view_count === 'number' ? Number(record.view_count) : 0
  }
}
