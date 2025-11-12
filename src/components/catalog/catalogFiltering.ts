import type { CatalogProductSummary } from './prepareCatalogProducts'

/**
 * Representa el producto ya preparado para el catálogo (datos lighweight).
 * Se utiliza como alias para evitar dependencias circulares con otros módulos.
 */
export type CatalogProduct = CatalogProductSummary

export type TagSummary = {
  label: string
  type: 'collection' | 'descriptor'
  count: number
}

export type ColorCodeSummary = {
  code: string
  count: number
}

export type ColorCountSummary = {
  label: string
  value: string
  count: number
}

export type SizeSummary = {
  value: string
  count: number
}

export type FilterState = {
  tags: string[]
  colorCodes: string[]
  colorCounts: string[]
  sizes: string[]
  onlyAvailable: boolean
  priceRange: [number, number]
  search: string
}

export type PriceStats = {
  min: number
  max: number
}

export type SortKey = 'priority' | 'name' | 'price'

const COLOR_CODE_REGEX = /^color\s+(\d{3})$/i

const COLOR_COUNT_PATTERNS: Record<string, string> = {
  'dos colors': '2',
  'de dos colors': '2',
  'dos colores': '2',
  'tres colors': '3',
  'de tres colors': '3',
  'tres colores': '3',
  'cuatro colores': '4',
  'quatre colors': '4',
  'de quatre colors': '4'
}

const COLOR_COUNT_LABELS: Record<string, string> = {
  '2': 'Dos colores',
  '3': 'Tres colores',
  '4': 'Cuatro colores'
}

const DEFAULT_PRIORITY = 1000

const NORMALISE = (value: string) => value.replace(/\s+/g, ' ').trim()

const getProductPriority = (product: CatalogProduct) =>
  typeof product.priority === 'number' ? product.priority : DEFAULT_PRIORITY

const classifyTag = (tag: string): TagSummary['type'] => {
  const lowered = tag.toLowerCase()
  if (lowered === 'artesanal' || lowered === 'tradicional') {
    return 'descriptor'
  }
  if (COLOR_CODE_REGEX.test(tag)) {
    return 'descriptor'
  }
  if (COLOR_COUNT_PATTERNS[lowered]) {
    return 'descriptor'
  }
  return 'collection'
}

/** Agrega estadísticas básicas del rango de precios para los sliders. */
export const computePriceStats = (products: CatalogProduct[]): PriceStats => {
  const prices = products
    .map(product => Number(product.price) || 0)
    .filter(price => Number.isFinite(price) && price >= 0)
  const min = prices.length > 0 ? Math.min(...prices) : 0
  const max = prices.length > 0 ? Math.max(...prices) : 0
  return { min, max }
}

/** Estado inicial de filtros basado en el rango de precios actual. */
export const createInitialFilterState = (stats: PriceStats): FilterState => ({
  tags: [],
  colorCodes: [],
  colorCounts: [],
  sizes: [],
  onlyAvailable: false,
  priceRange: [stats.min, stats.max],
  search: ''
})

/** Lista los tags más frecuentes para poblar el panel de filtros. */
export const summariseTags = (products: CatalogProduct[]): TagSummary[] => {
  const map = new Map<string, TagSummary>()

  products.forEach(product => {
    const productTags = product.tags || []
    productTags.forEach(rawTag => {
      const label = typeof rawTag === 'string' ? rawTag.trim() : ''
      if (!label) return
      const normalised = NORMALISE(label)
      if (COLOR_CODE_REGEX.test(normalised) || COLOR_COUNT_PATTERNS[normalised.toLowerCase()]) {
        return
      }

      const type = classifyTag(normalised)
      if (!map.has(normalised)) {
        map.set(normalised, { label: normalised, type, count: 0 })
      }
      const entry = map.get(normalised)!
      entry.count += 1
    })
  })

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/** Resume cuántos productos declaran un código de color concreto. */
export const summariseColorCodes = (products: CatalogProduct[]): ColorCodeSummary[] => {
  const map = new Map<string, number>()
  products.forEach(product => {
    (product.tags || []).forEach(tag => {
      const match = typeof tag === 'string' ? tag.match(COLOR_CODE_REGEX) : null
      if (!match) return
      const code = match[1]
      map.set(code, (map.get(code) || 0) + 1)
    })
  })

  return Array.from(map.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => Number(a.code) - Number(b.code))
}

/** Resume productos con etiquetas que indican número de colores. */
export const summariseColorCounts = (products: CatalogProduct[]): ColorCountSummary[] => {
  const map = new Map<string, ColorCountSummary>()

  products.forEach(product => {
    (product.tags || []).forEach(tag => {
      if (typeof tag !== 'string') return
      const lowered = NORMALISE(tag).toLowerCase()
      const value = COLOR_COUNT_PATTERNS[lowered]
      if (!value) return
      if (!map.has(value)) {
        map.set(value, { label: COLOR_COUNT_LABELS[value] ?? value, value, count: 0 })
      }
      const entry = map.get(value)!
      entry.count += 1
    })
  })

  return Array.from(map.values()).sort((a, b) => Number(a.value) - Number(b.value))
}

/** Resume todas las tallas encontradas para generar chips de selección. */
export const summariseSizes = (products: CatalogProduct[]): SizeSummary[] => {
  const map = new Map<string, number>()
  products.forEach(product => {
    (product.sizes || []).forEach(size => {
      const key = size.trim()
      if (!key) return
      map.set(key, (map.get(key) || 0) + 1)
    })
  })

  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, 'es'))
}

const extractColorCodesFromProduct = (product: CatalogProduct) =>
  (product.tags || [])
    .map(tag => {
      if (typeof tag !== 'string') return null
      const match = tag.match(COLOR_CODE_REGEX)
      return match ? match[1] : null
    })
    .filter((value): value is string => Boolean(value))

const extractColorCountsFromProduct = (product: CatalogProduct) =>
  (product.tags || [])
    .map(tag => {
      if (typeof tag !== 'string') return null
      const lowered = NORMALISE(tag).toLowerCase()
      return COLOR_COUNT_PATTERNS[lowered] ?? null
    })
    .filter((value): value is string => Boolean(value))

type SearchMatchesMap = Map<string, number> | null

/** Aplica todos los filtros activos sobre la lista de productos. */
export const filterCatalogProducts = (
  products: CatalogProduct[],
  filterState: FilterState,
  hasSearchQuery: boolean,
  searchMatches: SearchMatchesMap
) => {
  const baseList =
    hasSearchQuery && searchMatches
      ? products.filter(product => searchMatches.has(product.id))
      : products

  return baseList.filter(product => {
    const price = Number(product.price) || 0
    if (price < filterState.priceRange[0] || price > filterState.priceRange[1]) {
      return false
    }

    if (filterState.onlyAvailable && !product.available) {
      return false
    }

    if (filterState.sizes.length > 0) {
      const productSizes = product.sizes || []
      const matchesSize = filterState.sizes.some(size => productSizes.includes(size))
      if (!matchesSize) {
        return false
      }
    }

    const productTags = (product.tags || []).map(tag => NORMALISE(String(tag)).toLowerCase())
    const productColorCodes = extractColorCodesFromProduct(product)
    const productColorCounts = extractColorCountsFromProduct(product)

    const matchesTags = filterState.tags.every(tag =>
      productTags.includes(NORMALISE(tag).toLowerCase())
    )
    if (!matchesTags) return false

    const matchesColorCodes = filterState.colorCodes.every(code =>
      productColorCodes.includes(code)
    )
    if (!matchesColorCodes) return false

    const matchesColorCounts = filterState.colorCounts.every(count =>
      productColorCounts.includes(count)
    )
    if (!matchesColorCounts) return false

    return true
  })
}

/** Ordena los productos filtrados considerando búsquedas y prioridades. */
export const sortCatalogProducts = (
  products: CatalogProduct[],
  sortKey: SortKey,
  hasSearchQuery: boolean,
  searchMatches: SearchMatchesMap
) => {
  return [...products].sort((a, b) => {
    if (hasSearchQuery && searchMatches) {
      const scoreA = searchMatches.get(a.id)
      const scoreB = searchMatches.get(b.id)
      if (scoreA !== undefined || scoreB !== undefined) {
        const diff = (scoreA ?? 1) - (scoreB ?? 1)
        if (diff !== 0) {
          return diff
        }
      }
    }

    if (sortKey === 'price') {
      return a.price - b.price
    }

    if (sortKey === 'priority') {
      const diff = getProductPriority(a) - getProductPriority(b)
      if (diff !== 0) {
        return diff
      }
    }

    return a.name.localeCompare(b.name, 'es')
  })
}

/** Indica si algún filtro distinto a la búsqueda está activo. */
export const hasActiveFilters = (
  filterState: FilterState,
  priceStats: PriceStats,
  hasSearchQuery: boolean
) => {
  const priceRangeActive =
    filterState.priceRange[0] > priceStats.min || filterState.priceRange[1] < priceStats.max

  return (
    filterState.tags.length > 0 ||
    filterState.colorCodes.length > 0 ||
    filterState.colorCounts.length > 0 ||
    filterState.sizes.length > 0 ||
    filterState.onlyAvailable ||
    priceRangeActive ||
    hasSearchQuery
  )
}

export { COLOR_CODE_REGEX, COLOR_COUNT_PATTERNS, NORMALISE }
