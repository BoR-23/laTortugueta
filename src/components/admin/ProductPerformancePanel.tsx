'use client'

import { useMemo } from 'react'
import type { AdminProductFormValues } from '@/types/admin'

interface ProductPerformancePanelProps {
  products: AdminProductFormValues[]
  onInspect?: (productId: string) => void
}

const formatVisits = (views?: number) => {
  if (!views || views <= 0) return 'Sin datos'
  if (views > 999) {
    return `${(views / 1000).toFixed(1)}k visitas`
  }
  return `${views} visitas`
}

export function ProductPerformancePanel({ products, onInspect }: ProductPerformancePanelProps) {
  const ranked = useMemo(() => {
    return [...products]
      .filter(product => typeof product.viewCount === 'number' && product.viewCount > 0)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 6)
  }, [products])

  if (ranked.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">Visitas recientes</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Aún no se registran vistas suficientes. Cuando el catálogo reciba tráfico, los modelos más consultados aparecerán aquí.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">Modelos más vistos</h2>
          <p className="mt-2 text-xs text-neutral-500">Ranking basado en `view_count` (se actualiza automáticamente).</p>
        </div>
        {onInspect ? (
          <button
            type="button"
            onClick={() => onInspect(ranked[0].id)}
            className="rounded-full border border-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
          >
            Ver primero
          </button>
        ) : null}
      </div>
      <div className="mt-6 space-y-3">
        {ranked.map((product, index) => (
          <div key={product.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">#{index + 1} · {product.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">{product.id}</p>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.25em] text-neutral-500">
              <p className="font-semibold text-neutral-900">{formatVisits(product.viewCount)}</p>
              {product.category ? <p>{product.category}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
