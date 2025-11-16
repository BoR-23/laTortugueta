'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'

import { registerFilterUsage } from '@/lib/analytics'
import { expandSearchQuery } from '@/lib/search'

import {
  type CatalogProduct,
  type FilterState,
  type SortKey,
  type PriceStats,
  type SortDirection,
  createInitialFilterState,
  hasActiveFilters,
  getDefaultSortDirection
} from './catalogFiltering'

type SearchMatchesMap = Map<string, number> | null

interface UseCatalogFiltersResult {
  filterState: FilterState
  sortKey: SortKey
  setSortKey: (value: SortKey) => void
  sortDirection: SortDirection
  setSortDirection: (value: SortDirection) => void
  hasSearchQuery: boolean
  searchMatches: SearchMatchesMap
  filtersAreActive: boolean
  toggleTag: (tag: string) => void
  toggleColorCode: (code: string) => void
  toggleColorCount: (value: string) => void
  toggleSize: (value: string) => void
  toggleAvailability: () => void
  toggleFavorites: () => void
  updatePriceRange: (index: 0 | 1, value: number) => void
  handleSearchChange: (value: string) => void
  clearFilters: () => void
}

export const useCatalogFilters = (
  products: CatalogProduct[],
  priceStats: PriceStats,
  initialState?: FilterState,
  initialSortKey?: SortKey,
  initialSortDirection?: SortDirection
): UseCatalogFiltersResult => {
  const [filterState, setFilterState] = useState<FilterState>(() =>
    initialState ? { ...initialState } : createInitialFilterState(priceStats)
  )
  const initialKey = initialSortKey ?? 'priority'
  const [sortKeyState, setSortKeyState] = useState<SortKey>(initialKey)
  const [sortDirection, setSortDirectionState] = useState<SortDirection>(
    initialSortDirection ?? getDefaultSortDirection(initialKey)
  )

  useEffect(() => {
    if (initialState) {
      setFilterState({ ...initialState })
    }
  }, [initialState])

  useEffect(() => {
    const nextKey = initialSortKey ?? 'priority'
    setSortKeyState(nextKey)
    setSortDirectionState(initialSortDirection ?? getDefaultSortDirection(nextKey))
  }, [initialSortKey, initialSortDirection])
  const setSortKey = (value: SortKey) => {
    setSortKeyState(value)
    setSortDirectionState(getDefaultSortDirection(value))
  }
  const setSortDirection = (value: SortDirection) => {
    setSortDirectionState(value)
  }

  // Instanciamos Fuse solo cuando cambia la lista para no recalcular índices en cada pulsación.
  const fuse = useMemo(
    () =>
      new Fuse<CatalogProduct>(products, {
        keys: [
          { name: 'name', weight: 0.5 },
          { name: 'description', weight: 0.3 },
          { name: 'tags', weight: 0.15 },
          { name: 'category', weight: 0.1 }
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true
      }),
    [products]
  )

  const deferredSearch = useDeferredValue(filterState.search)
  const searchTerms = useMemo(() => expandSearchQuery(deferredSearch), [deferredSearch])
  const hasSearchQuery = searchTerms.length > 0

  const searchMatches = useMemo<SearchMatchesMap>(() => {
    if (!hasSearchQuery) return null

    const scores = new Map<string, number>()
    searchTerms.forEach(term => {
      fuse.search(term).forEach(result => {
        const score = typeof result.score === 'number' ? result.score : 0
        const current = scores.get(result.item.id)
        if (current === undefined || score < current) {
          scores.set(result.item.id, score)
        }
      })
    })
    return scores
  }, [fuse, hasSearchQuery, searchTerms])

  // Si cambian los precios base (por ejemplo, tras un refetch) reajustamos los límites del slider.
  useEffect(() => {
    setFilterState(prev => ({
      ...prev,
      priceRange: [
        Math.min(Math.max(prev.priceRange[0], priceStats.min), priceStats.max),
        Math.max(Math.min(prev.priceRange[1], priceStats.max), priceStats.min)
      ]
    }))
  }, [priceStats.min, priceStats.max])

  const filtersAreActive = hasActiveFilters(filterState, priceStats, hasSearchQuery)

  const toggleTag = (tag: string) => {
    setFilterState(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(item => item !== tag) : [...prev.tags, tag]
    }))
    registerFilterUsage(tag, filterState.tags.includes(tag) ? 'clear' : 'select')
  }

  const toggleColorCode = (code: string) => {
    setFilterState(prev => ({
      ...prev,
      colorCodes: prev.colorCodes.includes(code)
        ? prev.colorCodes.filter(item => item !== code)
        : [...prev.colorCodes, code]
    }))
    registerFilterUsage(`color-code-${code}`, filterState.colorCodes.includes(code) ? 'clear' : 'select')
  }

  const toggleColorCount = (value: string) => {
    setFilterState(prev => ({
      ...prev,
      colorCounts: prev.colorCounts.includes(value)
        ? prev.colorCounts.filter(item => item !== value)
        : [...prev.colorCounts, value]
    }))
    registerFilterUsage(
      `color-count-${value}`,
      filterState.colorCounts.includes(value) ? 'clear' : 'select'
    )
  }

  const toggleSize = (value: string) => {
    setFilterState(prev => ({
      ...prev,
      sizes: prev.sizes.includes(value)
        ? prev.sizes.filter(item => item !== value)
        : [...prev.sizes, value]
    }))
    registerFilterUsage(`size-${value}`, filterState.sizes.includes(value) ? 'clear' : 'select')
  }

  const toggleAvailability = () => {
    setFilterState(prev => ({
      ...prev,
      onlyAvailable: !prev.onlyAvailable
    }))
    registerFilterUsage('availability', filterState.onlyAvailable ? 'clear' : 'select')
  }

  const toggleFavorites = () => {
    setFilterState(prev => ({
      ...prev,
      onlyFavorites: !prev.onlyFavorites
    }))
    registerFilterUsage('favorites', filterState.onlyFavorites ? 'clear' : 'select')
  }

  const updatePriceRange = (index: 0 | 1, value: number) => {
    setFilterState(prev => {
      const nextRange: [number, number] = [...prev.priceRange] as [number, number]
      nextRange[index] = value
      const clampedRange: [number, number] = [
        Math.min(Math.max(nextRange[0], priceStats.min), priceStats.max),
        Math.max(Math.min(nextRange[1], priceStats.max), priceStats.min)
      ]
      clampedRange.sort((a, b) => a - b)
      return {
        ...prev,
        priceRange: clampedRange
      }
    })
  }

  const handleSearchChange = (value: string) => {
    setFilterState(prev => {
      const prevActive = prev.search.trim().length > 0
      const nextActive = value.trim().length > 0
      if (prevActive !== nextActive) {
        registerFilterUsage('search', nextActive ? 'select' : 'clear')
      }
      return {
        ...prev,
        search: value
      }
    })
  }

  const clearFilters = () => {
    setFilterState(createInitialFilterState(priceStats))
    registerFilterUsage('clear_all', 'clear')
  }

  return {
    filterState,
    sortKey: sortKeyState,
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
  }
}
