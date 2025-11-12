import { DEFAULT_PRODUCT_TYPE } from './productTypes'

const legacyCategoryToType: Record<string, string> = {
  gorros: 'gorro',
  gorro: 'gorro',
  capells: 'gorro',
  bufandes: 'bufanda',
  bufanda: 'bufanda',
  fulars: 'bufanda'
}

export const inferProductTypeFromCategory = (category?: string) => {
  if (!category) {
    return DEFAULT_PRODUCT_TYPE
  }
  const key = category.trim().toLowerCase()
  return legacyCategoryToType[key] ?? DEFAULT_PRODUCT_TYPE
}

export const getLegacyTypeMap = () => ({ ...legacyCategoryToType })
