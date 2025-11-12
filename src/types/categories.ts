export type CategoryScope = 'header' | 'filter'

export type CategoryDTO = {
  id: string
  scope: CategoryScope
  name: string
  tagKey: string | null
  parentId: string | null
  order: number
}

export type CategoryTreeNode = CategoryDTO & {
  children: CategoryTreeNode[]
}

export type CategorySidebarNode = {
  id: string
  name: string
  tagKey: string | null
  children: CategorySidebarNode[]
}
