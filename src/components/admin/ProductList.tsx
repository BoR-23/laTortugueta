'use client'

import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import type { AdminProductFormValues } from '@/types/admin'
import { expandSearchQuery } from '@/lib/search'

interface ProductListProps {
  products: AdminProductFormValues[]
  onEdit: (product: AdminProductFormValues) => void
  onDelete: (id: string) => Promise<void>
}

const formatOrder = (value?: number) => (value ?? 0).toString().padStart(3, '0')

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fuse = useMemo(
    () =>
      new Fuse<AdminProductFormValues>(products, {
        keys: [
          { name: 'name', weight: 0.5 },
          { name: 'description', weight: 0.25 },
          { name: 'category', weight: 0.15 },
          { name: 'tags', weight: 0.1 }
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true
      }),
    [products]
  )
  const searchTerms = useMemo(() => expandSearchQuery(search), [search])
  const hasSearch = searchTerms.length > 0

  const filtered = useMemo(() => {
    if (!hasSearch) {
      return products
    }

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

    if (scores.size === 0) {
      return []
    }

    const orderLookup = new Map<string, number>()
    products.forEach((product, index) => orderLookup.set(product.id, index))

    return products
      .filter(product => scores.has(product.id))
      .sort((a, b) => {
        const diff = (scores.get(a.id) ?? 1) - (scores.get(b.id) ?? 1)
        if (diff !== 0) {
          return diff
        }
        return (orderLookup.get(a.id) ?? 0) - (orderLookup.get(b.id) ?? 0)
      })
  }, [fuse, hasSearch, products, searchTerms])

  const handleDelete = async (id: string) => {
    setPendingDelete(id)
    setDeleting(true)
    setError(null)
    try {
      await onDelete(id)
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <input
        type="search"
        value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder="Buscar por nombre, categoria o descripcion (tolerante a errores)"
        className="w-full rounded-full border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-0"
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-700">
          <thead className="bg-neutral-50 text-xs uppercase tracking-[0.25em] text-neutral-500">
            <tr>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Disponibilidad</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {filtered.map(product => (
              <tr key={product.id}>
                <td className="px-4 py-4 align-top text-sm font-semibold text-neutral-500">
                  #{formatOrder(product.priority)}
                </td>
                <td className="px-4 py-4 align-top">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">{product.id}</p>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                    {product.category || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                    {product.type || '—'}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-sm text-neutral-700">
                  {product.price.toFixed(2)} EUR
                </td>
                <td className="px-4 py-4 align-top text-sm">
                  {product.available ? (
                    <span className="text-green-600">Disponible</span>
                  ) : (
                    <span className="text-neutral-400">Borrador</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-4 py-2"
                      onClick={() => onEdit(product)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 disabled:opacity-50"
                      onClick={() => handleDelete(product.id)}
                      disabled={pendingDelete === product.id && deleting}
                    >
                      {pendingDelete === product.id && deleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-500">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
