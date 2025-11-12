'use client'

import { useEffect, useMemo, useState } from 'react'

interface ProductRow {
  id: string
  name: string
  price: number
  category: string
}

interface PricingManagerProps {
  products: ProductRow[]
}

type RowState = ProductRow & {
  draftPrice: string
  dirty: boolean
  saving: boolean
  error: string | null
  success: boolean
}

export function PricingManager({ products }: PricingManagerProps) {
  const initialRows = useMemo<RowState[]>(() => {
    return products.map(product => ({
      ...product,
      draftPrice: product.price.toString(),
      dirty: false,
      saving: false,
      error: null,
      success: false,
    }))
  }, [products])

  const [rows, setRows] = useState<RowState[]>(initialRows)
  const [globalMessage, setGlobalMessage] = useState<string | null>(null)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const updateRow = (id: string, updates: Partial<RowState>) => {
    setRows(current =>
      current.map(row => (row.id === id ? { ...row, ...updates } : row))
    )
  }

  const handleDraftChange = (id: string, value: string) => {
    const sanitizedValue = value.replace(/,/g, '.')
    updateRow(id, {
      draftPrice: sanitizedValue,
      dirty: true,
      success: false,
      error: null,
    })
  }

  const handleSave = async (id: string) => {
    const row = rows.find(item => item.id === id)
    if (!row) return

    const parsed = Number(row.draftPrice)
    if (!Number.isFinite(parsed) || parsed < 0) {
      updateRow(id, { error: 'Introduce un valor numérico válido.' })
      return
    }

    updateRow(id, { saving: true, error: null, success: false })
    setGlobalMessage(null)

    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, price: parsed }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'No se pudo guardar el precio.')
      }

      updateRow(id, {
        price: Number(parsed.toFixed(2)),
        draftPrice: Number(parsed.toFixed(2)).toString(),
        dirty: false,
        saving: false,
        success: true,
      })
      setGlobalMessage('Cambios guardados correctamente.')
    } catch (error) {
      updateRow(id, {
        saving: false,
        error: error instanceof Error ? error.message : 'Error inesperado.',
      })
    }
  }

  const handleReset = (id: string) => {
    const row = rows.find(item => item.id === id)
    if (!row) return

    updateRow(id, {
      draftPrice: row.price.toString(),
      dirty: false,
      error: null,
      success: false,
    })
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Catálogo activo
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Ajusta el precio de cada diseño y guarda los cambios para sincronizarlos con la web.
          </p>
        </div>
        {globalMessage && (
          <span className="rounded-full border border-neutral-300 px-4 py-2 text-xs uppercase tracking-[0.25em] text-neutral-600">
            {globalMessage}
          </span>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-700">
          <thead className="bg-neutral-50 text-xs uppercase tracking-[0.25em] text-neutral-500">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Colección</th>
              <th className="px-4 py-3">Precio actual</th>
              <th className="px-4 py-3">Nuevo precio</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {rows.map(row => (
              <tr key={row.id}>
                <td className="px-4 py-4 align-top">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{row.name}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">{row.id}</p>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                    {row.category}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-sm text-neutral-700">
                  {row.price.toFixed(2)} €
                </td>
                <td className="px-4 py-4 align-top">
                  <input
                    type="number"
                    step="0.01"
                    value={row.draftPrice}
                    onChange={event => handleDraftChange(row.id, event.target.value)}
                    className="w-28 rounded-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
                  />
                  {row.error && (
                    <p className="mt-2 text-xs text-red-500">{row.error}</p>
                  )}
                  {row.success && (
                    <p className="mt-2 text-xs text-neutral-500">Guardado.</p>
                  )}
                </td>
                <td className="px-4 py-4 align-top text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleReset(row.id)}
                      className="btn-secondary px-4 py-2"
                      disabled={!row.dirty || row.saving}
                    >
                      Deshacer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(row.id)}
                      className="btn-primary px-4 py-2 disabled:opacity-40"
                      disabled={!row.dirty || row.saving}
                    >
                      {row.saving ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
