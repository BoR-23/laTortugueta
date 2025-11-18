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
