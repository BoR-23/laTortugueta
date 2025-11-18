import fs from 'fs'
import path from 'path'
import type { AdminProductDraftRecord, AdminProductFormValues } from '@/types/admin'

const DRAFTS_PATH = path.join(process.cwd(), 'data', 'admin-product-drafts.json')
const MAX_DRAFTS = 200

const readDrafts = (): AdminProductDraftRecord[] => {
  try {
    const contents = fs.readFileSync(DRAFTS_PATH, 'utf8')
    const parsed = JSON.parse(contents)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeDrafts = (drafts: AdminProductDraftRecord[]) => {
  fs.mkdirSync(path.dirname(DRAFTS_PATH), { recursive: true })
  fs.writeFileSync(DRAFTS_PATH, JSON.stringify(drafts.slice(-MAX_DRAFTS), null, 2), 'utf8')
}

const sanitiseDraftValues = (input: Partial<AdminProductFormValues>): AdminProductFormValues => ({
  id: String(input.id ?? '').trim(),
  name: String(input.name ?? ''),
  description: String(input.description ?? ''),
  category: String(input.category ?? ''),
  type: String(input.type ?? ''),
  color: String(input.color ?? ''),
  price: Number(input.price ?? 0),
  priority: Number(input.priority ?? 0),
  tags: Array.isArray(input.tags) ? input.tags.map(tag => String(tag)) : [],
  sizes: Array.isArray(input.sizes) ? input.sizes.map(size => String(size)) : [],
  available: Boolean(input.available),
  gallery: Array.isArray(input.gallery) ? input.gallery.map(item => String(item)) : [],
  metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
})

export const getProductDraft = (id: string): AdminProductDraftRecord | null => {
  if (!id) {
    return null
  }
  const drafts = readDrafts()
  return drafts.find(entry => entry.id === id) ?? null
}

export const saveProductDraft = ({
  values,
  actor
}: {
  values: AdminProductFormValues
  actor?: AdminProductDraftRecord['actor']
}) => {
  if (!values.id) {
    throw new Error('El borrador necesita un identificador.')
  }

  const drafts = readDrafts().filter(entry => entry.id !== values.id)
  const record: AdminProductDraftRecord = {
    id: values.id,
    values: sanitiseDraftValues(values),
    updatedAt: new Date().toISOString(),
    actor
  }

  drafts.push(record)
  writeDrafts(drafts)
  return record
}

export const deleteProductDraft = (id: string) => {
  const drafts = readDrafts()
  const next = drafts.filter(entry => entry.id !== id)
  writeDrafts(next)
}
