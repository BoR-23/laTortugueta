'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { CategoryTabsNav, type CategoryNavNode } from '@/components/layout/CategoryTabsNav'
import type { CategoryDTO, CategoryTreeNode, CategorySidebarNode } from '@/types/categories'
import type { CatalogProduct, FilterState, PriceStats, SortKey } from './catalogFiltering'
import {
  computePriceStats,
  summariseTags,
  summariseColorCodes,
  summariseColorCounts,
  summariseSizes,
  filterCatalogProducts,
  sortCatalogProducts,
  createInitialFilterState
} from './catalogFiltering'
import { useCatalogFilters } from './useCatalogFilters'
import { FilterSidebar } from './FilterSidebar'
import { ProductGrid, type GridColumns } from './ProductGrid'
import { useFavorites } from '@/hooks/useFavorites'
import { primaryNavLinks } from '@/lib/navigation'

const SORT_KEYS: SortKey[] = ['priority', 'name', 'price']
const VIEW_COLUMN_OPTIONS: GridColumns[] = [2, 3, 4]

const isSortKey = (value: string | null): value is SortKey => SORT_KEYS.includes(value as SortKey)

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

const mapTreeForSidebar = (nodes: CategoryTreeNode[]): CategorySidebarNode[] =>
  nodes.map(node => ({
    id: node.id,
    name: node.name,
    tagKey: node.tagKey,
    children: mapTreeForSidebar(node.children)
  }))

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
  return params
}

interface TagFilterPanelProps {
  products: CatalogProduct[]
  headerCategories: CategoryDTO[]
  filterCategories: CategoryDTO[]
}

export function TagFilterPanel({ products, headerCategories, filterCategories }: TagFilterPanelProps) {
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

  const headerNavTabs: CategoryNavNode[] = useMemo(() => flattenNavNodes(headerTree), [headerTree])
  const managedFilterTree: CategorySidebarNode[] = useMemo(
    () => mapTreeForSidebar(filterTree),
    [filterTree]
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
  } = useCatalogFilters(products, priceStats, initialFilterFromQuery, initialSortFromQuery)
  const [shareUrl, setShareUrl] = useState('')
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [gridColumns, setGridColumns] = useState<GridColumns>(3)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastAppliedQueryRef = useRef(currentQuery)

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, filterState, hasSearchQuery, searchMatches, favoriteSet),
    [products, filterState, hasSearchQuery, searchMatches, favoriteSet]
  )

  const sortedProducts = useMemo(
    () => sortCatalogProducts(filteredProducts, sortKey, hasSearchQuery, searchMatches),
    [filteredProducts, sortKey, hasSearchQuery, searchMatches]
  )

  useEffect(() => {
    const params = serializeFiltersToParams(filterState, sortKey, priceStats)
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
  }, [filterState, sortKey, priceStats, pathname, router, currentQuery])

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

  const closeFilters = () => setFiltersOpen(false)
  const toggleFilters = () => setFiltersOpen(prev => !prev)
  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen(prev => !prev)

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
          <div className="order-1 flex w-full flex-wrap items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500 sm:order-2 sm:w-auto">
            <button
              type="button"
              onClick={toggleMenu}
              className={`rounded-full border px-4 py-1.5 text-[10px] transition md:hidden ${
                menuOpen
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900'
              }`}
            >
              Menú
            </button>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-neutral-400">Vista</span>
                {VIEW_COLUMN_OPTIONS.map(option => {
                  const isActive = gridColumns === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGridColumns(option)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] transition ${
                      isActive
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
                className={`rounded-full border px-4 py-1.5 text-[10px] transition ${
                  filtersOpen
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900'
                }`}
              >
                {filtersOpen ? 'Ocultar filtros' : 'Filtros'}
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
        />
      </div>

      <div className={`fixed inset-0 z-40 flex justify-end bg-black/40 transition-opacity ${filtersOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'}`}>
        <button
          type="button"
          aria-label="Cerrar filtros"
          className="flex-1"
          onClick={closeFilters}
        />
        <div
          className={`no-scrollbar pointer-events-auto flex h-full w-full max-w-[420px] flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ${
            filtersOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
            <span>Filtros</span>
            <button type="button" className="text-neutral-900" onClick={closeFilters}>
              Cerrar
            </button>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
            <FilterSidebar
              collectionTags={collectionTags}
              descriptorTags={descriptorTags}
              colorCodeSummaries={colorCodeSummaries}
              colorCountSummaries={colorCountSummaries}
              sizeSummaries={sizeSummaries}
              filterState={filterState}
              sortKey={sortKey}
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
              onClearFilters={clearFilters}
              onShareFilters={canShare ? handleShareFilters : undefined}
              shareStatus={shareStatus}
              searchInputRef={searchInputRef}
              managedCategories={managedFilterTree}
              favoritesEnabled={filterState.onlyFavorites}
            />
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-40 flex justify-start bg-black/40 transition-opacity md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'}`}>
        <div
          className={`pointer-events-auto flex h-full w-full max-w-[320px] flex-col border-r border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
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
        </div>
        <button
          type="button"
          aria-label="Cerrar menú"
          className="flex-1"
          onClick={closeMenu}
        />
      </div>
    </section>
  )
}
