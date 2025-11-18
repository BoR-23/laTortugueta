import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

import { createSupabaseServerClient } from './supabaseClient'

export type CategoryScope = 'header' | 'filter'

export type CategoryRecord = {
  id: string
  scope: CategoryScope
  name: string
  tagKey: string | null
  parentId: string | null
  order: number
}

const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json')

const supabaseCategoriesEnabled =
  process.env.NETLIFY
    ? true
    : Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

const ensureSupabaseEnabled = () => {
  if (!supabaseCategoriesEnabled) {
    throw new Error(
      'La gestión de categorías requiere Supabase configurado. Define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
}

const ensureCategoriesFile = async () => {
  try {
    await fs.access(categoriesFilePath)
  } catch {
    await fs.mkdir(path.dirname(categoriesFilePath), { recursive: true })
    await fs.writeFile(categoriesFilePath, '[]', 'utf8')
  }
}

type CategoryRow = {
  id: string
  scope: CategoryScope
  name: string
  tag_key: string | null
  parent_id: string | null
  sort_order: number | null
}

const mapRowToRecord = (row: CategoryRow): CategoryRecord => ({
  id: row.id,
  scope: row.scope,
  name: row.name,
  tagKey: row.tag_key ?? null,
  parentId: row.parent_id ?? null,
  order: typeof row.sort_order === 'number' ? row.sort_order : 0
})

const readCategoriesFromDisk = async (): Promise<CategoryRecord[]> => {
  await ensureCategoriesFile()
  const raw = await fs.readFile(categoriesFilePath, 'utf8')
  const data = raw.trim() ? (JSON.parse(raw) as CategoryRecord[]) : []
  return data.map(record => ({
    ...record,
    parentId: record.parentId ?? null,
    tagKey: record.tagKey ?? null
  }))
}

const readCategoriesFromSupabase = async (): Promise<CategoryRecord[]> => {
  const client = createSupabaseServerClient()
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('scope', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudieron leer las categorías.')
  }

  return data.map(mapRowToRecord)
}

export const readCategories = async (): Promise<CategoryRecord[]> => {
  if (supabaseCategoriesEnabled) {
    return readCategoriesFromSupabase()
  }

  return readCategoriesFromDisk()
}

export const getCategories = async (scope?: CategoryScope) => {
  const all = await readCategories()
  const filtered = scope ? all.filter(category => category.scope === scope) : all
  return filtered.sort((a, b) => {
    if (a.scope !== b.scope) {
      return a.scope.localeCompare(b.scope)
    }
    if ((a.parentId ?? '') === (b.parentId ?? '')) {
      return a.order - b.order
    }
    return (a.parentId ?? '').localeCompare(b.parentId ?? '')
  })
}

const nextOrderForParent = (records: CategoryRecord[], scope: CategoryScope, parentId: string | null) => {
  const siblings = records.filter(record => record.scope === scope && record.parentId === parentId)
  if (!siblings.length) return 0
  return Math.max(...siblings.map(record => record.order)) + 1
}

export const createCategoryRecord = async (input: {
  name: string
  tagKey?: string | null
  parentId?: string | null
  scope: CategoryScope
}) => {
  ensureSupabaseEnabled()
  const categories = await readCategories()
  const record: CategoryRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    tagKey: input.tagKey?.trim() || null,
    scope: input.scope,
    parentId: input.parentId ?? null,
    order: nextOrderForParent(categories, input.scope, input.parentId ?? null)
  }
  const client = createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('categories')
    .insert({
      id: record.id,
      name: record.name,
      scope: record.scope,
      tag_key: record.tagKey,
      parent_id: record.parentId,
      sort_order: record.order,
      updated_at: now
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear la categoría.')
  }

  return mapRowToRecord(data as CategoryRow)
}

export const updateCategoryRecord = async (
  id: string,
  input: Partial<Pick<CategoryRecord, 'name' | 'tagKey' | 'parentId'>>
) => {
  ensureSupabaseEnabled()
  const categories = await readCategories()
  const index = categories.findIndex(category => category.id === id)
  if (index === -1) {
    throw new Error('Category not found')
  }
  const prev = categories[index]
  const parentId = input.parentId === undefined ? prev.parentId : input.parentId ?? null
  const client = createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('categories')
    .update({
      name: input.name?.trim() || prev.name,
      tag_key: input.tagKey !== undefined ? input.tagKey?.trim() || null : prev.tagKey,
      parent_id: parentId,
      updated_at: now
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo actualizar la categoría.')
  }

  const updatedRecord = mapRowToRecord(data as CategoryRow)

  const prevTag = prev.tagKey
  const nextTag = updatedRecord.tagKey
  if (prevTag && nextTag && prevTag !== nextTag) {
    const { error: renameError } = await client.rpc('rename_product_tag', {
      old_tag: prevTag,
      new_tag: nextTag
    })
    if (renameError) {
      const rollbackPayload = {
        name: prev.name,
        tag_key: prev.tagKey,
        parent_id: prev.parentId,
        updated_at: new Date().toISOString()
      }
      await client
        .from('categories')
        .update(rollbackPayload)
        .eq('id', id)
      throw new Error(
        renameError.message || 'No se pudieron actualizar las etiquetas de los productos.'
      )
    }
  }

  return updatedRecord
}

export const deleteCategoryRecord = async (id: string) => {
  ensureSupabaseEnabled()
  const categories = await readCategories()
  if (!categories.some(category => category.id === id)) {
    throw new Error('Category not found')
  }
  const idsToDelete = new Set<string>()
  const collect = (targetId: string) => {
    idsToDelete.add(targetId)
    categories
      .filter(category => category.parentId === targetId)
      .forEach(child => collect(child.id))
  }
  collect(id)
  const client = createSupabaseServerClient()
  const { error } = await client.from('categories').delete().in('id', Array.from(idsToDelete))
  if (error) {
    if (error.code === '23503') {
      const err = new Error('CATEGORY_IN_USE')
      ;(err as Error & { code?: string }).code = 'CATEGORY_IN_USE'
      throw err
    }
    throw new Error(error.message)
  }
  return { deleted: idsToDelete.size }
}

export const reorderCategories = async (
  updates: Array<{ id: string; parentId: string | null; order: number }>
) => {
  ensureSupabaseEnabled()
  if (updates.length === 0) {
    return readCategories()
  }
  const client = createSupabaseServerClient()
  const now = new Date().toISOString()
  const { error } = await client
    .from('categories')
    .upsert(
      updates.map(update => ({
        id: update.id,
        parent_id: update.parentId,
        sort_order: update.order,
        updated_at: now
      })),
      { onConflict: 'id' }
    )

  if (error) {
    throw new Error(error.message)
  }

  return readCategories()
}

export const buildCategoryTree = (records: CategoryRecord[]) => {
  type NodeWithChildren = CategoryRecord & { children: NodeWithChildren[] }
  const lookup = new Map<string, NodeWithChildren>()
  records.forEach(record => {
    lookup.set(record.id, { ...record, children: [] })
  })
  const roots: NodeWithChildren[] = []
  lookup.forEach(node => {
    if (node.parentId && lookup.has(node.parentId)) {
      lookup.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortRecursive = (nodes: NodeWithChildren[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(child => sortRecursive(child.children))
  }
  sortRecursive(roots)
  return roots
}
