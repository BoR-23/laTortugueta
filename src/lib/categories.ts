import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

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

const ensureCategoriesFile = async () => {
  try {
    await fs.access(categoriesFilePath)
  } catch {
    await fs.mkdir(path.dirname(categoriesFilePath), { recursive: true })
    await fs.writeFile(categoriesFilePath, '[]', 'utf8')
  }
}

export const readCategories = async (): Promise<CategoryRecord[]> => {
  await ensureCategoriesFile()
  const raw = await fs.readFile(categoriesFilePath, 'utf8')
  const data = raw.trim() ? (JSON.parse(raw) as CategoryRecord[]) : []
  return data.map(record => ({
    ...record,
    parentId: record.parentId ?? null,
    tagKey: record.tagKey ?? null
  }))
}

const writeCategories = async (categories: CategoryRecord[]) => {
  await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf8')
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
  const categories = await readCategories()
  const record: CategoryRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    tagKey: input.tagKey?.trim() || null,
    scope: input.scope,
    parentId: input.parentId ?? null,
    order: nextOrderForParent(categories, input.scope, input.parentId ?? null)
  }
  categories.push(record)
  await writeCategories(categories)
  return record
}

export const updateCategoryRecord = async (
  id: string,
  input: Partial<Pick<CategoryRecord, 'name' | 'tagKey' | 'parentId'>>
) => {
  const categories = await readCategories()
  const index = categories.findIndex(category => category.id === id)
  if (index === -1) {
    throw new Error('Category not found')
  }
  const prev = categories[index]
  const parentId = input.parentId === undefined ? prev.parentId : input.parentId ?? null
  categories[index] = {
    ...prev,
    name: input.name?.trim() || prev.name,
    tagKey: input.tagKey !== undefined ? input.tagKey?.trim() || null : prev.tagKey,
    parentId
  }
  await writeCategories(categories)
  return categories[index]
}

export const deleteCategoryRecord = async (id: string) => {
  const categories = await readCategories()
  const idsToDelete = new Set<string>()
  const collect = (targetId: string) => {
    idsToDelete.add(targetId)
    categories
      .filter(category => category.parentId === targetId)
      .forEach(child => collect(child.id))
  }
  collect(id)
  const remaining = categories.filter(category => !idsToDelete.has(category.id))
  await writeCategories(remaining)
  return { deleted: idsToDelete.size }
}

export const reorderCategories = async (
  updates: Array<{ id: string; parentId: string | null; order: number }>
) => {
  const categories = await readCategories()
  const map = new Map(updates.map(update => [update.id, update]))
  const updated = categories.map(category => {
    const update = map.get(category.id)
    if (!update) return category
    return {
      ...category,
      parentId: update.parentId,
      order: update.order
    }
  })
  await writeCategories(updated)
  return updated
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
