'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { CategoryTabsNav, type CategoryNavNode } from '@/components/layout/CategoryTabsNav'
import type { CategoryDTO, CategoryTreeNode, CategorySidebarNode } from '@/types/categories'
import type {
  CatalogProduct,
  FilterState,
  PriceStats,
  SortDirection,
  SortKey
} from './catalogFiltering'
import {
  COLOR_CODE_REGEX,
  computePriceStats,
  summariseTags,
  summariseColorCodes,
  summariseColorCounts,
  summariseSizes,
  filterCatalogProducts,
  sortCatalogProducts,
  createInitialFilterState,
  getDefaultSortDirection
} from './catalogFiltering'
import { useCatalogFilters } from './useCatalogFilters'
import { ProductGrid, type GridColumns } from './ProductGrid'
import { useFavorites } from '@/hooks/useFavorites'
import { primaryNavLinks } from '@/lib/navigation'

const SORT_KEYS: SortKey[] = ['priority', 'name', 'price', 'views']
const SORT_OPTION_LABELS: Record<SortKey, string> = {
  priority: 'Orden manual',
  name: 'Nombre',
  price: 'Precio',
  views: 'Popularidad'
}
const VIEW_COLUMN_OPTIONS: GridColumns[] = [2, 3, 4]

const LazyFilterSidebar = dynamic(() =>
  import('./FilterSidebar').then(mod => ({ default: mod.FilterSidebar })),
  {
    ssr: false,
    loading: () => (
      <div className="px-5 py-4 text-sm text-neutral-500">Cargando filtros…</div>
    )
  }
)

const isSortKey = (value: string | null): value is SortKey => SORT_KEYS.includes(value as SortKey)
const isSortDirection = (value: string | null): value is SortDirection =>
  value === 'asc' || value === 'desc'

const parseListParam = (value: string | null) =>
  value ? value.split(',').map(item => item.trim()).filter(Boolean) : []

const buildTreeFromRecords = (records: CategoryDTO[]): CategoryTreeNode[] => {
  const lookup = new Map<string, CategoryTreeNode>()
  records.forEach(record => {
    lookup.set(record.id, {
      ...record,
      children: []
    })
  })

  const roots: CategoryTreeNode[] = []
  lookup.forEach(node => {
    if (node.parentId && lookup.has(node.parentId)) {
      lookup.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortRecursive = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(child => sortRecursive(child.children))
  }

  sortRecursive(roots)
  return roots
}

const flattenNavNodes = (nodes: CategoryTreeNode[]): CategoryNavNode[] =>
  nodes.map(node => ({
    id: node.id,
    name: node.name,
    tagKey: node.tagKey,
    children: node.children.length ? flattenNavNodes(node.children) : undefined
  }))

const mapTreeForSidebar = (nodes: CategoryTreeNode[]): CategorySidebarNode[] => {
  const sorted = [...nodes].sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()

    // Custom sort: ensure "letra" comes before "dos letras" (e.g. Alcoi con letra vs Alcoy con dos letras)
    // Alphabetically "dos" (d) comes before "letra" (l), but user wants logical order
    const isLetraA = nameA.includes('letra') && !nameA.includes('dos letras')
    const isDosLetrasA = nameA.includes('dos letras')

    const isLetraB = nameB.includes('letra') && !nameB.includes('dos letras')
    const isDosLetrasB = nameB.includes('dos letras')

    if (isLetraA && isDosLetrasB) return -1
    if (isDosLetrasA && isLetraB) return 1

    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  })

  return sorted.map(node => ({
    id: node.id,
    name: node.name,
    tagKey: node.tagKey,
    children: mapTreeForSidebar(node.children)
  }))
}

const stripColorCodeNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] =>
  nodes
    .map(node => {
      if (node.tagKey && COLOR_CODE_REGEX.test(node.tagKey)) {
        return null
      }
      const children = stripColorCodeNodes(node.children)
      if (!node.tagKey && children.length === 0) {
        return null
      }
      return { ...node, children }
    })
    .filter((node): node is CategoryTreeNode => Boolean(node))

const buildFallbackTreeFromTags = (
  tags: ReturnType<typeof summariseTags>,
  scope: CategoryDTO['scope']
): CategoryTreeNode[] => {
  const nodes = tags.map((tag, index) => ({
    id: `fallback-${scope}-${index}`,
    scope,
    name: tag.label,
    tagKey: tag.label,
    parentId: null,
    order: index,
    children: []
  }))

  if (scope === 'header') {
    return [
      {
        id: 'fallback-header-all',
        scope: 'header',
        name: 'Archivo completo',
        tagKey: null,
        parentId: null,
        order: -1,
        children: []
      },
      ...nodes
    ]
  }

  return nodes
}

const buildFilterStateFromParams = (
  params: URLSearchParams,
  stats: PriceStats
): FilterState => {
  const state = createInitialFilterState(stats)
  const search = params.get('search')
  if (search) state.search = search
  const tags = parseListParam(params.get('tags'))
  if (tags.length) state.tags = tags
  const colorCodes = parseListParam(params.get('codes'))
  if (colorCodes.length) state.colorCodes = colorCodes
  const colorCounts = parseListParam(params.get('counts'))
  if (colorCounts.length) state.colorCounts = colorCounts
  const sizes = parseListParam(params.get('sizes'))
  if (sizes.length) state.sizes = sizes
  const price = params.get('price')
  if (price) {
    const [minStr, maxStr] = price.split('-')
    const min = Number(minStr)
    const max = Number(maxStr)
    if (Number.isFinite(min) && Number.isFinite(max)) {
      state.priceRange = [
        Math.min(Math.max(min, stats.min), stats.max),
        Math.max(Math.min(max, stats.max), stats.min)
      ].sort((a, b) => a - b) as [number, number]
    }
  }
  if (params.get('available') === '1') {
    state.onlyAvailable = true
  }
  if (params.get('fav') === '1') {
    state.onlyFavorites = true
  }
  return state
}

const serializeFiltersToParams = (
  filterState: FilterState,
  sortKey: SortKey,
  sortDirection: SortDirection,
  stats: PriceStats
) => {
  const params = new URLSearchParams()
  const trimmedSearch = filterState.search.trim()
  if (trimmedSearch) params.set('search', trimmedSearch)
  if (filterState.tags.length) params.set('tags', filterState.tags.join(','))
  if (filterState.colorCodes.length) params.set('codes', filterState.colorCodes.join(','))
  if (filterState.colorCounts.length) params.set('counts', filterState.colorCounts.join(','))
  if (filterState.sizes.length) params.set('sizes', filterState.sizes.join(','))
  if (
    filterState.priceRange[0] > stats.min ||
    filterState.priceRange[1] < stats.max
  ) {
    params.set('price', `${filterState.priceRange[0]}-${filterState.priceRange[1]}`)
  }
  if (filterState.onlyAvailable) {
    params.set('available', '1')
  }
  if (filterState.onlyFavorites) {
    params.set('fav', '1')
  }
  if (sortKey !== 'priority') {
    params.set('sort', sortKey)
  }
  const defaultDirection = getDefaultSortDirection(sortKey)
  if (sortDirection !== defaultDirection) {
    params.set('dir', sortDirection)
  }
  return params
}

interface TagFilterPanelProps {
  products: CatalogProduct[]
  headerCategories: CategoryDTO[]
  filterCategories: CategoryDTO[]
  showPopularityBadges?: boolean
}

export function TagFilterPanel({ products, headerCategories, filterCategories, showPopularityBadges = false }: TagFilterPanelProps) {
  const priceStats = useMemo(() => computePriceStats(products), [products])
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const currentQuery = searchParams.toString()
  const tagSummaries = useMemo(() => summariseTags(products), [products])
  const collectionTags = useMemo(() => tagSummaries.filter(tag => tag.type === 'collection'), [tagSummaries])
  const descriptorTags = useMemo(() => tagSummaries.filter(tag => tag.type === 'descriptor'), [tagSummaries])
  const colorCodeSummaries = useMemo(() => summariseColorCodes(products), [products])
  const colorCountSummaries = useMemo(() => summariseColorCounts(products), [products])
  const sizeSummaries = useMemo(() => summariseSizes(products), [products])
  const initialFilterFromQuery = useMemo(
    () => buildFilterStateFromParams(searchParams, priceStats),
    [searchParams, priceStats]
  )
  const initialSortFromQuery = useMemo(() => {
    const value = searchParams.get('sort')
    return isSortKey(value) ? value : undefined
  }, [searchParams])
  const initialDirectionFromQuery = useMemo(() => {
    const value = searchParams.get('dir')
    return isSortDirection(value) ? value : undefined
  }, [searchParams])

  const headerTree = useMemo(() => {
    const tree = buildTreeFromRecords(headerCategories)
    if (tree.length) return tree
    return buildFallbackTreeFromTags(collectionTags, 'header')
  }, [headerCategories, collectionTags])

  const filterTree = useMemo(() => {
    const tree = buildTreeFromRecords(filterCategories)
    if (tree.length) return tree
    return buildFallbackTreeFromTags(collectionTags, 'filter')
  }, [filterCategories, collectionTags])
  const sanitizedFilterTree = useMemo(() => stripColorCodeNodes(filterTree), [filterTree])

  const headerNavTabs: CategoryNavNode[] = useMemo(() => flattenNavNodes(headerTree), [headerTree])
  const managedFilterTree: CategorySidebarNode[] = useMemo(
    () => mapTreeForSidebar(sanitizedFilterTree),
    [sanitizedFilterTree]
  )

  const { favorites, favoriteSet, toggleFavorite } = useFavorites()
  const mobileMenuLinks = useMemo(
    () => primaryNavLinks.filter(link => !link.external && link.href !== '/admin'),
    []
  )

  const {
    filterState,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    hasSearchQuery,
    searchMatches,
    filtersAreActive,
    toggleTag,
    toggleColorCode,
    toggleColorCount,
    toggleSize,
    toggleAvailability,
    toggleFavorites,
    updatePriceRange,
    handleSearchChange,
    clearFilters
  } = useCatalogFilters(
    products,
    priceStats,
    initialFilterFromQuery,
    initialSortFromQuery,
    initialDirectionFromQuery
  )
  const [shareUrl, setShareUrl] = useState('')
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [gridColumns, setGridColumns] = useState<GridColumns>(4 as GridColumns)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastAppliedQueryRef = useRef(currentQuery)
  const swipeStateRef = useRef({
    startX: 0,
    startY: 0,
    active: false
  })
  const toggleSortDirection = () =>
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, filterState, hasSearchQuery, searchMatches, favoriteSet),
    [products, filterState, hasSearchQuery, searchMatches, favoriteSet]
  )

  const sortedProducts = useMemo(
    () => sortCatalogProducts(filteredProducts, sortKey, sortDirection, hasSearchQuery, searchMatches),
    [filteredProducts, sortKey, sortDirection, hasSearchQuery, searchMatches]
  )

  useEffect(() => {
    const params = serializeFiltersToParams(filterState, sortKey, sortDirection, priceStats)
    const queryString = params.toString()
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname

    if (queryString === currentQuery) {
      lastAppliedQueryRef.current = currentQuery
      if (typeof window !== 'undefined') {
        setShareUrl(`${window.location.origin}${targetPath}`)
      } else {
        setShareUrl(targetPath)
      }
      return
    }

    if (lastAppliedQueryRef.current === queryString) {
      return
    }

    lastAppliedQueryRef.current = queryString
    router.replace(targetPath, { scroll: false })
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}${targetPath}`)
    } else {
      setShareUrl(targetPath)
    }
  }, [filterState, sortKey, sortDirection, priceStats, pathname, router, currentQuery])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSearchFocus = () => {
      const focusInput = () => {
        const target = searchInputRef.current
        target?.focus()
        target?.select()
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      setFiltersOpen(true)
      setTimeout(focusInput, 220)
    }

    window.addEventListener('catalog:focus-search', handleSearchFocus)
    return () => {
      window.removeEventListener('catalog:focus-search', handleSearchFocus)
    }
  }, [])

  useEffect(() => {
    if (!filtersOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtersOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const detail = { tags: filterState.tags }
    window.dispatchEvent(new CustomEvent('catalog:filters-changed', { detail }))
  }, [filterState.tags])

  const closeFilters = () => setFiltersOpen(false)
  const toggleFilters = () => setFiltersOpen(prev => !prev)
  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen(prev => !prev)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterState.search.trim()) count += 1
    count += filterState.tags.length
    count += filterState.colorCodes.length
    count += filterState.colorCounts.length
    count += filterState.sizes.length
    if (filterState.onlyAvailable) count += 1
    if (filterState.onlyFavorites) count += 1
    const [minPrice, maxPrice] = filterState.priceRange
    if (minPrice > priceStats.min || maxPrice < priceStats.max) {
      count += 1
    }
    return count
  }, [filterState, priceStats])

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.clipboard)

  const handleShareFilters = async () => {
    if (!canShare || !shareUrl) {
      setShareStatus('error')
      setTimeout(() => setShareStatus('idle'), 2000)
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch {
      setShareStatus('error')
      setTimeout(() => setShareStatus('idle'), 2000)
    }
  }

  return (
    <section id="colecciones" className="bg-white">
      <div className="sticky top-[64px] z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-sm sm:top-[72px] lg:top-[80px]">
        <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 lg:px-8">
          <div className="order-2 flex-1 overflow-x-auto sm:order-1">
            <CategoryTabsNav tabs={headerNavTabs} />
          </div>
          <div className="order-1 w-full sm:order-2 sm:w-auto">
            <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-900 md:hidden">
              <button
                type="button"
                onClick={toggleMenu}
                className={`rounded-full border-2 px-4 py-1.5 transition ${menuOpen
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
                  }`}
              >
                Menú
              </button>
              <button
                type="button"
                onClick={toggleFilters}
                className={`rounded-full border-2 px-4 py-1.5 transition ${filtersOpen
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
                  }`}
              >
                {filtersOpen
                  ? 'Ocultar filtros'
                  : activeFilterCount > 0
                    ? `Filtros (${activeFilterCount})`
                    : 'Filtros'}
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-900 md:hidden">
              <span className="text-neutral-500">Ordenar</span>
              <div className="flex items-center gap-2">
                <select
                  value={sortKey}
                  onChange={event => setSortKey(event.target.value as SortKey)}
                  className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[10px] tracking-[0.25em] text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
                  style={{ WebkitAppearance: 'none' }}
                  aria-label="Ordenar catálogo"
                >
                  {SORT_KEYS.map(option => (
                    <option key={option} value={option}>
                      {SORT_OPTION_LABELS[option]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={toggleSortDirection}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-[12px] text-neutral-900 transition hover:border-neutral-900 hover:text-neutral-900"
                  aria-label={sortDirection === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            <div className="mt-3 hidden flex-wrap items-center justify-end gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-900 md:flex">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Ordenar</span>
                <div className="flex items-center gap-2">
                  <select
                    value={sortKey}
                    onChange={event => setSortKey(event.target.value as SortKey)}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[10px] tracking-[0.25em] text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
                    style={{ WebkitAppearance: 'none' }}
                    aria-label="Ordenar catálogo"
                  >
                    {SORT_KEYS.map(option => (
                      <option key={option} value={option}>
                        {SORT_OPTION_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={toggleSortDirection}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] text-neutral-900 transition hover:border-neutral-900 hover:text-neutral-900"
                    aria-label={sortDirection === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Vista</span>
                {VIEW_COLUMN_OPTIONS.map(option => {
                  const isActive = gridColumns === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGridColumns(option)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${isActive
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900'
                        }`}
                      aria-pressed={isActive}
                    >
                      {option}x
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={toggleFilters}
                className={`rounded-full border-2 px-4 py-1.5 text-[10px] font-semibold transition ${filtersOpen
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
                  }`}
              >
                {filtersOpen
                  ? 'Ocultar filtros'
                  : activeFilterCount > 0
                    ? `Filtros (${activeFilterCount})`
                    : 'Filtros'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
        <ProductGrid
          products={sortedProducts}
          filterState={filterState}
          filtersAreActive={filtersAreActive}
          gridColumns={gridColumns}
          favorites={favoriteSet}
          onToggleFavorite={toggleFavorite}
          showPopularityBadges={showPopularityBadges}
        />
      </div>

      {filtersOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[64px] z-40 flex justify-end bg-black/40 sm:top-[72px] lg:top-[80px]">
          <button
            type="button"
            aria-label="Cerrar filtros"
            className="flex-1"
            onClick={closeFilters}
          />
          <div
            className="pointer-events-auto flex h-full w-full max-w-[420px] flex-col border-l border-neutral-200 bg-white shadow-2xl"
            onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
              const touch = event.touches[0]
              swipeStateRef.current = { startX: touch.clientX, startY: touch.clientY, active: true }
            }}
            onTouchMove={(event: TouchEvent<HTMLDivElement>) => {
              if (!swipeStateRef.current.active) return
              const touch = event.touches[0]
              const deltaX = touch.clientX - swipeStateRef.current.startX
              const deltaY = Math.abs(touch.clientY - swipeStateRef.current.startY)
              if (deltaY > 80) {
                swipeStateRef.current.active = false
                return
              }
              if (deltaX > 80) {
                swipeStateRef.current.active = false
                closeFilters()
              }
            }}
            onTouchEnd={() => {
              swipeStateRef.current.active = false
            }}
          >
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
              <LazyFilterSidebar
                collectionTags={collectionTags}
                descriptorTags={descriptorTags}
                colorCodeSummaries={colorCodeSummaries}
                colorCountSummaries={colorCountSummaries}
                sizeSummaries={sizeSummaries}
                filterState={filterState}
                sortKey={sortKey}
                sortDirection={sortDirection}
                priceStats={priceStats}
                filtersAreActive={filtersAreActive}
                onToggleTag={toggleTag}
                onToggleColorCode={toggleColorCode}
                onToggleColorCount={toggleColorCount}
                onToggleSize={toggleSize}
                onToggleAvailability={toggleAvailability}
                onToggleFavorites={toggleFavorites}
                onPriceChange={updatePriceRange}
                onSearchChange={handleSearchChange}
                onSortChange={value => setSortKey(value)}
                onSortDirectionChange={value => setSortDirection(value)}
                onClearFilters={clearFilters}
                onShareFilters={canShare ? handleShareFilters : undefined}
                shareStatus={shareStatus}
                searchInputRef={searchInputRef}
                managedCategories={managedFilterTree}
                favoritesEnabled={filterState.onlyFavorites}
                onClose={closeFilters}
              />
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMenu}
          />
          <aside
            className="absolute inset-y-0 left-0 flex h-full w-full max-w-[320px] flex-col border-r border-neutral-200 bg-white shadow-2xl"
            role="dialog"
            aria-label="Menú principal"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
              <span>Menú</span>
              <button type="button" className="text-neutral-900" onClick={closeMenu}>
                Cerrar
              </button>
            </div>
            <nav className="no-scrollbar flex-1 overflow-y-auto px-5 py-6">
              <ul className="space-y-3 text-sm font-semibold text-neutral-800">
                {mobileMenuLinks.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block rounded-2xl border border-neutral-200 px-4 py-3 uppercase tracking-[0.25em] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </section>
  )
}
