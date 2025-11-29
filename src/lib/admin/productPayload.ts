import type { ProductMetadata, ProductMutationInput } from '../products'

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map(item => String(item)) : []

const toPriorityValue = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value ?? '')
  return Number.isFinite(numeric) ? numeric : undefined
}

const toMetadata = (value: unknown): ProductMetadata => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ProductMetadata
  }
  return {} as ProductMetadata
}

export const parseProductPayload = (
  payload: Record<string, unknown>
): ProductMutationInput => ({
  id: String(payload.id ?? '').trim(),
  name: String(payload.name ?? '').trim(),
  description: String(payload.description ?? ''),
  category: typeof payload.category === 'string' ? payload.category : '',
  priority: toPriorityValue(payload.priority),
  color: typeof payload.color === 'string' ? payload.color : '',
  price: Number(payload.price ?? 0),
  tags: toStringArray(payload.tags),
  sizes: toStringArray(payload.sizes),
  available: Boolean(payload.available),
  type: typeof payload.type === 'string' ? payload.type : '',
  material: typeof payload.material === 'string' ? payload.material : '',
  care: typeof payload.care === 'string' ? payload.care : '',
  origin: typeof payload.origin === 'string' ? payload.origin : '',
  metadata: toMetadata(payload.metadata)
})

export const parsePartialProductPayload = (
  payload: Record<string, unknown>
): Partial<ProductMutationInput> => {
  const output: Partial<ProductMutationInput> = {}

  if (payload.id !== undefined) output.id = String(payload.id ?? '').trim()
  if (payload.name !== undefined) output.name = String(payload.name ?? '').trim()
  if (payload.description !== undefined) output.description = String(payload.description ?? '')
  if (payload.category !== undefined) output.category = typeof payload.category === 'string' ? payload.category : ''
  if (payload.priority !== undefined) output.priority = toPriorityValue(payload.priority)
  if (payload.color !== undefined) output.color = typeof payload.color === 'string' ? payload.color : ''
  if (payload.price !== undefined) output.price = Number(payload.price ?? 0)
  if (payload.tags !== undefined) output.tags = toStringArray(payload.tags)
  if (payload.sizes !== undefined) output.sizes = toStringArray(payload.sizes)
  if (payload.available !== undefined) output.available = Boolean(payload.available)
  if (payload.type !== undefined) output.type = typeof payload.type === 'string' ? payload.type : ''
  if (payload.material !== undefined) output.material = typeof payload.material === 'string' ? payload.material : ''
  if (payload.care !== undefined) output.care = typeof payload.care === 'string' ? payload.care : ''
  if (payload.origin !== undefined) output.origin = typeof payload.origin === 'string' ? payload.origin : ''
  if (payload.metadata !== undefined) output.metadata = toMetadata(payload.metadata)

  return output
}
