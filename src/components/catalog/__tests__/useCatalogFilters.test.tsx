import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import type { CatalogProductSummary } from '../prepareCatalogProducts'
import { useCatalogFilters } from '../useCatalogFilters'

vi.mock('@/lib/analytics', () => ({
  registerFilterUsage: vi.fn()
}))

const sampleProducts: CatalogProductSummary[] = [
  {
    id: 'uno',
    name: 'Calcetin Rojo',
    image: '/images/products/uno.jpg',
    price: 20,
    tags: ['archivo', 'color 101'],
    category: 'calcetin',
    description: 'Rojo tradicional',
    sizes: ['38-40'],
    available: true,
    priority: 1
  },
  {
    id: 'dos',
    name: 'Calcetin Azul',
    image: '/images/products/dos.jpg',
    price: 35,
    tags: ['archivo', 'color 205'],
    category: 'calcetin',
    description: 'Azul marino',
    sizes: ['40-42'],
    available: true,
    priority: 2
  }
]

const priceStats = { min: 20, max: 35 }

describe('useCatalogFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inicializa el rango de precios usando las métricas recibidas', () => {
    const { result } = renderHook(() => useCatalogFilters(sampleProducts, priceStats))
    expect(result.current.filterState.priceRange).toEqual([20, 35])

    act(() => result.current.updatePriceRange(0, 10))
    expect(result.current.filterState.priceRange[0]).toBe(20)
  })

  it('marca filtros activos al activar disponibilidad y se pueden limpiar', () => {
    const { result } = renderHook(() => useCatalogFilters(sampleProducts, priceStats))

    expect(result.current.filtersAreActive).toBe(false)

    act(() => result.current.toggleAvailability())
    expect(result.current.filterState.onlyAvailable).toBe(true)
    expect(result.current.filtersAreActive).toBe(true)

    act(() => result.current.clearFilters())
    expect(result.current.filtersAreActive).toBe(false)
  })

  it('permite alternar tags y actualiza el estado correspondiente', () => {
    const { result } = renderHook(() => useCatalogFilters(sampleProducts, priceStats))

    act(() => result.current.toggleTag('archivo'))
    expect(result.current.filterState.tags).toContain('archivo')

    act(() => result.current.toggleTag('archivo'))
    expect(result.current.filterState.tags).not.toContain('archivo')
  })

  it('habilita el filtro de favoritos', () => {
    const { result } = renderHook(() => useCatalogFilters(sampleProducts, priceStats))

    expect(result.current.filterState.onlyFavorites).toBe(false)

    act(() => result.current.toggleFavorites())
    expect(result.current.filterState.onlyFavorites).toBe(true)
  })
})
