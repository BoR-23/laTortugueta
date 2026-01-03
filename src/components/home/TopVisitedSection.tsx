'use client'

import Link from 'next/link'

import type { CatalogProductSummary } from '@/components/catalog/prepareCatalogProducts'
import { ProductImage } from '@/components/common/ProductImage'

interface TopVisitedSectionProps {
  products: CatalogProductSummary[]
}

export function TopVisitedSection({ products }: TopVisitedSectionProps) {
  // Products are already sorted and sliced by the server
  const ranked = products

  if (ranked.length === 0) {
    return null
  }

  return (
    <section className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Archivo vivo</p>
            <h2 className="text-3xl font-semibold text-neutral-900">Top visitas de la semana</h2>
            <p className="text-sm text-neutral-600">
              Las fichas más consultadas dentro del catálogo, actualizadas automáticamente con las métricas reales.
            </p>
          </div>
          <span className="rounded-full border border-neutral-200 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
            {ranked.length} destacados
          </span>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map(product => (
            <Link
              key={product.id}
              href={`/${product.id}`}
              className="group flex flex-col gap-4 rounded-3xl border border-neutral-200 p-5 transition hover:border-neutral-900"
              title={product.name}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white">
                {product.image ? (
                  <ProductImage
                    imagePath={product.image}
                    variant="thumb"
                    alt={product.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    placeholder="empty"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-400">
                    Sin imagen
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full border border-white bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                  +{product.viewCount}
                  <span className="ml-1 text-[9px] text-neutral-200">visitas</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{product.category ?? 'Archivo'}</p>
                <h3 className="text-lg font-semibold text-neutral-900">{product.name}</h3>
                <p className="text-sm text-neutral-600">
                  {product.price.toFixed(2)} €
                  <span className="ml-1 text-xs uppercase tracking-[0.2em] text-neutral-500">+ gastos de envío</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
