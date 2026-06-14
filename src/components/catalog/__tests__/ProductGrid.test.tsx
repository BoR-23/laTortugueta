import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductGrid } from '../ProductGrid'
import type { CatalogProduct } from '../catalogFiltering'
import type { FilterState } from '../catalogFiltering'

vi.mock('next/link', async () => {
  const React = await import('react')
  return {
    default: ({ href, children, prefetch: _prefetch, ...props }: any) =>
      React.createElement('a', { href, ...props }, children)
  }
})

vi.mock('@/components/common/ProductImage', async () => {
  const React = await import('react')
  return {
    ProductImage: ({ alt }: { alt?: string }) =>
      React.createElement('img', { alt: alt ?? '' })
  }
})

const filterState: FilterState = {
  tags: [],
  colorCodes: [],
  colorCounts: [],
  sizes: [],
  onlyAvailable: false,
  onlyFavorites: false,
  priceRange: [0, 100],
  search: ''
}

const buildProducts = (count: number): CatalogProduct[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `producto-${index + 1}`,
    name: `Producto ${index + 1}`,
    image: `/images/products/producto-${index + 1}.jpg`,
    price: 25,
    tags: [],
    category: 'calcetin',
    sizes: [],
    available: true,
    priority: index + 1
  }))

describe('ProductGrid', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 390
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 844
    })
  })

  it('renders the complete catalog on compact viewports after hydration', async () => {
    render(
      <ProductGrid
        products={buildProducts(30)}
        filterState={filterState}
        filtersAreActive={false}
        gridColumns={4}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Producto 30')).toBeInTheDocument()
    })
    expect(screen.getAllByRole('link')).toHaveLength(30)
  })
})
