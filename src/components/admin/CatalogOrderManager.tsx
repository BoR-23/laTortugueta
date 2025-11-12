'use client'

import { useEffect, useState } from 'react'
import type { AdminProductFormValues } from '@/types/admin'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'

interface CatalogOrderManagerProps {
  products: AdminProductFormValues[]
  onPrioritiesUpdated: (updates: { id: string; priority: number }[]) => void
}

const priorityOf = (value?: number) =>
  typeof value === 'number' ? value : DEFAULT_PRODUCT_PRIORITY

const sortItems = (items: AdminProductFormValues[]) =>
  [...items].sort((a, b) => {
    const diff = priorityOf(a.priority) - priorityOf(b.priority)
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'es')
  })

export function CatalogOrderManager({
  products,
  onPrioritiesUpdated
}: CatalogOrderManagerProps) {
  const [ordered, setOrdered] = useState<AdminProductFormValues[]>(() => sortItems(products))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setOrdered(sortItems(products))
  }, [products])

  const reorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    setOrdered(current => {
      const next = [...current]
      const sourceIndex = next.findIndex(product => product.id === sourceId)
      const targetIndex = next.findIndex(product => product.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) {
        return current
      }
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    const payload = ordered.map((product, index) => ({
      id: product.id,
      priority: index + 1
    }))

    try {
      const response = await fetch('/api/products/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorities: payload })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error ?? 'No se pudo guardar el orden.')
      }

      onPrioritiesUpdated(payload)
      setSuccessMessage('Orden actualizado.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Orden manual del catalogo
          </h2>
          <p className="mt-2 text-xs text-neutral-500">
            Arrastra para decidir que fichas aparecen primero. Guarda para publicar el cambio.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-5 py-3 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar orden'}
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {ordered.map((product, index) => (
          <div
            key={product.id}
            draggable
            onDragStart={() => setDraggingId(product.id)}
            onDragOver={event => event.preventDefault()}
            onDragEnter={() => {
              if (draggingId) {
                reorder(draggingId, product.id)
              }
            }}
            onDragEnd={() => setDraggingId(null)}
            className={`flex cursor-move items-center justify-between rounded-2xl border px-4 py-3 transition ${
              draggingId === product.id
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 bg-white'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{product.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
                {product.id}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
              <span className="font-semibold text-neutral-900">
                #{(index + 1).toString().padStart(3, '0')}
              </span>
              <span className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-500">
                {product.category || 'Catalogo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {successMessage && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </section>
  )
}
