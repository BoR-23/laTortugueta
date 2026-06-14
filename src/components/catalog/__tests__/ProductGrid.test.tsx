import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  let scrollOffset = 0

  beforeEach(() => {
    scrollOffset = 0
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        private callback: ResizeObserverCallback

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback
        }

        observe(target: Element) {
          this.callback(
            [{ target, contentRect: { width: 380, height: 20000 } as DOMRectReadOnly } as ResizeObserverEntry],
            this
          )
        }

        unobserve() {}
        disconnect() {}
      }
    )
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(performance.now()), 0)
    })
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
      window.clearTimeout(handle)
    })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0,
      y: -scrollOffset,
      top: -scrollOffset,
      bottom: 20000 - scrollOffset,
      left: 0,
      right: 380,
      width: 380,
      height: 20000,
      toJSON: () => ({})
    } as DOMRect))

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

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('virtualizes compact viewports while keeping the end of the catalog reachable', async () => {
    render(
      <ProductGrid
        products={buildProducts(30)}
        filterState={filterState}
        filtersAreActive={false}
        gridColumns={4}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Producto 24')).not.toBeInTheDocument()
    })
    expect(screen.getAllByRole('link').length).toBeLessThan(30)

    scrollOffset = 18000
    window.dispatchEvent(new Event('scroll'))

    await waitFor(() => {
      expect(screen.getByText('Producto 30')).toBeInTheDocument()
    })
    expect(screen.getAllByRole('link').length).toBeLessThan(30)
  })
})
