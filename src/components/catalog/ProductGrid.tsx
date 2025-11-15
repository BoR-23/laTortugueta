'use client'

import Image from 'next/image'
import Link from 'next/link'

import { getProductImageVariant } from '@/lib/images'

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

      <div className={GRID_CLASS_BY_COLUMNS[gridColumns]}>
        {products.map((product, index) => {
          const isPriorityCard = index === 0
          return (
            <Link
              key={product.id}
              href={`/${product.id}`}
              prefetch={false}
              className="group space-y-4 text-center sm:text-left"
            >
            <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden bg-white">
              {onToggleFavorite ? (
                <button
                  type="button"
                  aria-label={isFavorite(product.id) ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
                  className={`absolute right-2 top-2 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                    isFavorite(product.id)
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
                <Image
                  src={getProductImageVariant(product.image, 'thumb')}
                  alt={product.name}
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 40vw, 90vw"
                  placeholder={product.imagePlaceholder ? 'blur' : 'empty'}
                  blurDataURL={product.imagePlaceholder}
                  priority={isPriorityCard}
                  loading={isPriorityCard ? 'eager' : undefined}
                  fetchPriority={isPriorityCard ? 'high' : 'auto'}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-400">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {product.category ?? 'Archivo'}
              </p>
              <h2 className="text-base font-medium text-neutral-900">{product.name}</h2>
              <p className="text-sm text-neutral-600">{product.price.toFixed(2)} EUR</p>
            </div>
            </Link>
        )})}
      </div>
    </div>
  )
}
