'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ProductImage } from '@/components/common/ProductImage'

import type { CatalogProduct, FilterState } from './catalogFiltering'

export type GridColumns = 2 | 3 | 4

interface ProductGridProps {
  products: CatalogProduct[]
  filterState: FilterState
  filtersAreActive: boolean
  gridColumns: GridColumns
  favorites?: Set<string>
  onToggleFavorite?: (id: string) => void
  showPopularityBadges?: boolean
}

const GRID_CLASS_BY_COLUMNS: Record<GridColumns, string> = {
  2: 'grid gap-10 sm:grid-cols-2 lg:grid-cols-2',
  3: 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
}

const GRID_GAP_BY_COLUMNS: Record<GridColumns, number> = {
  2: 40,
  3: 40,
  4: 32
}

const ESTIMATED_TEXT_HEIGHT = 88
const DEFAULT_VIRTUALIZATION_BUFFER_ROWS = 2
const DEFAULT_MIN_ROWS_WITHOUT_VIRTUALIZATION = 4
const COMPACT_VIRTUALIZATION_BUFFER_ROWS = 6
const COMPACT_MIN_ROWS_WITHOUT_VIRTUALIZATION = 8
const COMPACT_VIEWPORT_BREAKPOINT = 1024

export const ProductGrid = ({
  products,
  filterState,
  filtersAreActive,
  gridColumns,
  favorites,
  onToggleFavorite,
  showPopularityBadges = false
}: ProductGridProps) => {
  const isFavorite = (id: string) => (favorites ? favorites.has(id) : false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      if (!entries[0]) return
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const updateViewportSize = () => {
      setWindowHeight(window.innerHeight || 0)
      setViewportWidth(window.innerWidth || 0)
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  const isCompactViewport = viewportWidth > 0 && viewportWidth < COMPACT_VIEWPORT_BREAKPOINT
  const bufferRows = isCompactViewport
    ? COMPACT_VIRTUALIZATION_BUFFER_ROWS
    : DEFAULT_VIRTUALIZATION_BUFFER_ROWS
  const minRowsWithoutVirtualization = isCompactViewport
    ? COMPACT_MIN_ROWS_WITHOUT_VIRTUALIZATION
    : DEFAULT_MIN_ROWS_WITHOUT_VIRTUALIZATION

  const gap = GRID_GAP_BY_COLUMNS[gridColumns]
  const columnCount = gridColumns
  const cardWidth = useMemo(() => {
    if (containerWidth <= 0) return 0
    const totalGap = gap * Math.max(columnCount - 1, 0)
    return (containerWidth - totalGap) / columnCount
  }, [containerWidth, columnCount, gap])

  const rowMetrics = useMemo(() => {
    if (cardWidth <= 0) {
      return { cardHeight: 0, rowHeight: 0 }
    }
    const imageHeight = cardWidth * (4 / 3)
    const cardHeight = imageHeight + ESTIMATED_TEXT_HEIGHT
    return { cardHeight, rowHeight: cardHeight + gap }
  }, [cardWidth, gap])

  const rowCount = Math.max(1, Math.ceil(products.length / columnCount))
  const virtualizationEnabled =
    !isCompactViewport &&
    containerWidth > 0 &&
    rowMetrics.rowHeight > 0 &&
    rowCount > minRowsWithoutVirtualization

  const [visibleRows, setVisibleRows] = useState<{ start: number; end: number }>({
    start: 0,
    end: minRowsWithoutVirtualization
  })

  useEffect(() => {
    if (!virtualizationEnabled) return
    let raf: number | null = null
    const scheduleUpdate = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => {
        raf = null
        if (!containerRef.current || rowMetrics.rowHeight === 0) return
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight || 0
        const offsetTop = Math.max(-rect.top, 0)
        const visibleHeight = Math.max(0, Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top))
        const startRow = Math.max(Math.floor(offsetTop / rowMetrics.rowHeight) - bufferRows, 0)
        const endRow = Math.min(
          Math.ceil((offsetTop + visibleHeight) / rowMetrics.rowHeight) + bufferRows,
          rowCount
        )
        setVisibleRows({
          start: startRow,
          end: Math.max(endRow, startRow + minRowsWithoutVirtualization)
        })
      })
    }
    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (raf !== null) {
        cancelAnimationFrame(raf)
      }
    }
  }, [virtualizationEnabled, rowMetrics.rowHeight, rowCount, bufferRows, minRowsWithoutVirtualization])

  useEffect(() => {
    if (!virtualizationEnabled) {
      setVisibleRows({ start: 0, end: rowCount })
    }
  }, [virtualizationEnabled, rowCount])

  useEffect(() => {
    setVisibleRows(prev => ({
      start: 0,
      end: Math.max(prev.end, minRowsWithoutVirtualization)
    }))
  }, [minRowsWithoutVirtualization])

  // SSR / Initial Load Optimization:
  // If virtualization is NOT enabled (SSR or initial client render before measure),
  // we limit the number of rendered items to avoid a massive HTML payload.
  // 24 items is enough to fill the viewport on most screens (4x6 or 3x8).
  const INITIAL_RENDER_COUNT = 24

  const startIndex = virtualizationEnabled ? visibleRows.start * columnCount : 0

  // Calculate end index:
  // 1. If virtualization is ON, use the calculated visible end.
  // 2. If virtualization is OFF (SSR), use a hard limit (INITIAL_RENDER_COUNT).
  // 3. But if we are on client and just measured 0 width (unlikely but possible), safe fallback.
  // The critical part is SSR: containerWidth is 0, so virtualizationEnabled is false.

  const endIndex = virtualizationEnabled
    ? Math.min(products.length, visibleRows.end * columnCount)
    : Math.min(products.length, INITIAL_RENDER_COUNT)

  const topPadding = virtualizationEnabled ? visibleRows.start * rowMetrics.rowHeight : 0
  const bottomPadding = virtualizationEnabled ? Math.max(rowCount - visibleRows.end, 0) * rowMetrics.rowHeight : 0

  const gridHeightEstimate = virtualizationEnabled
    ? Math.max(windowHeight - 280, rowMetrics.rowHeight * minRowsWithoutVirtualization)
    : undefined

  const renderProducts = products.slice(startIndex, endIndex)

  return (
    <div className="flex-1">
      <div className="mb-6 flex flex-col gap-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{products.length.toString().padStart(3, '0')} resultados</span>
        {filterState.search.trim() && (
          <span className="text-neutral-600">Buscando: &quot;{filterState.search.trim()}&quot;</span>
        )}
        {filtersAreActive && !filterState.search.trim() && (
          <span className="text-neutral-600">Filtros activos</span>
        )}
      </div>

      <div ref={containerRef} style={gridHeightEstimate ? { minHeight: gridHeightEstimate } : undefined}>
        {topPadding > 0 && <div style={{ height: topPadding }} />}
        <div className={GRID_CLASS_BY_COLUMNS[gridColumns]}>
          {renderProducts.map((product, localIndex) => {
            const realIndex = startIndex + localIndex
            const isPriorityCard = realIndex === 0
            return (
              <Link
                key={product.id}
                href={`/${product.id}`}
                prefetch={false}
                className="group space-y-4 text-center sm:text-left"
                title={product.name}
              >
                <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden bg-white">
                  {onToggleFavorite ? (
                    <button
                      type="button"
                      aria-label={isFavorite(product.id) ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
                      className={`absolute right-2 top-2 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${isFavorite(product.id)
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-white/80 bg-white/80 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                        }`}
                      onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()
                        onToggleFavorite(product.id)
                      }}
                    >
                      {isFavorite(product.id) ? '★' : '☆'}
                    </button>
                  ) : null}
                  {showPopularityBadges && typeof product.viewCount === 'number' && product.viewCount >= 100 ? (
                    <div className="absolute left-2 top-2 rounded-full border border-white bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white">
                      +{product.viewCount}
                      <span className="ml-1 text-[9px] text-neutral-200">visitas</span>
                    </div>
                  ) : null}
                  {product.image ? (
                    <ProductImage
                      imagePath={product.image}
                      variant="thumb"
                      alt={product.name}
                      fill
                      className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes={
                        gridColumns === 4
                          ? '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw'
                          : gridColumns === 3
                            ? '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                            : '(min-width: 640px) 50vw, 100vw'
                      }
                      placeholder="empty"
                      priority={isPriorityCard}
                      loading={isPriorityCard ? 'eager' : 'lazy'}
                      fetchPriority={isPriorityCard ? 'high' : 'auto'}
                      quality={80}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="h-[88px] flex flex-col justify-start gap-1 py-1">
                  <h3 className="text-base font-medium text-neutral-900 line-clamp-2 leading-tight" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-auto">
                    {product.price.toFixed(2)} €
                    <span className="ml-1 text-xs uppercase tracking-[0.2em] text-neutral-500">+ gastos de envío</span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
        {bottomPadding > 0 && <div style={{ height: bottomPadding }} />}
      </div>
    </div>
  )
}
