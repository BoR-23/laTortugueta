'use client'

import { useEffect, useMemo, useState, useRef, Fragment } from 'react'
import type { KeyboardEvent } from 'react'
import Image from 'next/image'
import Fuse from 'fuse.js'
import type { AdminProductFormValues } from '@/types/admin'
import { expandSearchQuery } from '@/lib/search'
import { getProductImageVariant } from '@/lib/images'
import { ProductTaggingGalleryModal } from './ProductTaggingGalleryModal'

interface ProductListProps {
  products: AdminProductFormValues[]
  onEdit: (product: AdminProductFormValues) => void
  onDelete: (id: string) => Promise<void>
  onPriceUpdate: (id: string, price: number) => Promise<void>
  onToggleAvailability: (id: string, current: boolean) => Promise<void>
  onArchiveStatusChange: (id: string, archived: boolean, available: boolean) => Promise<void>
  onRefresh?: () => void
}

const formatOrder = (value?: number) => (value ?? 0).toString().padStart(3, '0')

type PriceDraftState = {
  value: string
  dirty: boolean
  saving: boolean
  error: string | null
  success: boolean
}

const buildPriceState = (products: AdminProductFormValues[]): Record<string, PriceDraftState> => {
  const entries: Record<string, PriceDraftState> = {}
  products.forEach(product => {
    entries[product.id] = {
      value: product.price.toFixed(2),
      dirty: false,
      saving: false,
      error: null,
      success: false
    }
  })
  return entries
}

export function ProductList({ products, onEdit, onDelete, onPriceUpdate, onToggleAvailability, onArchiveStatusChange, onRefresh }: ProductListProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, PriceDraftState>>(() =>
    buildPriceState(products)
  )

  // Duplicate modal state
  const [duplicateTarget, setDuplicateTarget] = useState<AdminProductFormValues | null>(null)

  // Tagging modal state
  const [taggingProduct, setTaggingProduct] = useState<AdminProductFormValues | null>(null)

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
    let result = products

    // Filter by tab
    if (activeTab === 'active') {
      // Active tab shows everything NOT archived (includes published and drafts)
      result = result.filter(p => !p.metadata?.archived)
    } else {
      // Archived tab shows ONLY archived items
      result = result.filter(p => p.metadata?.archived === true)
    }

    if (!hasSearch) {
      return result
    }

    const scores = new Map<string, number>()
    searchTerms.forEach(term => {
      fuse.search(term).forEach(result => {
        const isArchived = result.item.metadata?.archived === true

        // Check if item is in the current tab result set
        if (activeTab === 'active' && isArchived) return
        if (activeTab === 'archived' && !isArchived) return

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

    return result
      .filter(product => scores.has(product.id))
      .sort((a, b) => {
        // First sort by availability (Drafts first in 'active' tab)
        if (activeTab === 'active') {
          if (a.available !== b.available) {
            return a.available ? 1 : -1 // false (draft) comes before true (available)
          }
        }

        const diff = (scores.get(a.id) ?? 1) - (scores.get(b.id) ?? 1)
        if (diff !== 0) {
          return diff
        }
        return (orderLookup.get(a.id) ?? 0) - (orderLookup.get(b.id) ?? 0)
      })
  }, [fuse, hasSearch, products, searchTerms, activeTab])

  useEffect(() => {
    setPriceDrafts(prev => {
      const next: Record<string, PriceDraftState> = {}
      products.forEach(product => {
        const existing = prev[product.id]
        const formatted = product.price.toFixed(2)
        next[product.id] = existing
          ? {
            ...existing,
            value: existing.dirty ? existing.value : formatted
          }
          : {
            value: formatted,
            dirty: false,
            saving: false,
            error: null,
            success: false
          }
      })
      return next
    })
  }, [products])

  const updatePriceDraft = (id: string, updates: Partial<PriceDraftState>) => {
    setPriceDrafts(current => {
      const existing = current[id] ?? {
        value: '',
        dirty: false,
        saving: false,
        error: null,
        success: false
      }
      return {
        ...current,
        [id]: {
          ...existing,
          ...updates
        }
      }
    })
  }

  const handlePriceChange = (id: string, value: string) => {
    const sanitized = value.replace(/,/g, '.')
    updatePriceDraft(id, {
      value: sanitized,
      dirty: true,
      error: null,
      success: false
    })
  }

  const handlePriceSubmit = async (id: string) => {
    const draft = priceDrafts[id]
    if (!draft) return
    const trimmedValue = draft.value.trim()
    if (!trimmedValue) {
      updatePriceDraft(id, { error: 'Introduce un valor numérico.' })
      return
    }
    const parsed = Number(trimmedValue)
    if (!Number.isFinite(parsed) || parsed < 0) {
      updatePriceDraft(id, { error: 'Introduce un valor válido (>= 0).' })
      return
    }
    updatePriceDraft(id, { saving: true, error: null })
    try {
      await onPriceUpdate(id, Number(parsed.toFixed(2)))
      updatePriceDraft(id, {
        saving: false,
        dirty: false,
        success: true,
        value: parsed.toFixed(2)
      })
    } catch (err) {
      updatePriceDraft(id, {
        saving: false,
        error: err instanceof Error ? err.message : 'No se pudo guardar.'
      })
    }
  }

  const handlePriceKeyDown = (event: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handlePriceSubmit(id)
    }
  }

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

  const handleDuplicate = async (variant: 'exact' | 'bordado' | 'con-letra' | 'con-dos-letras') => {
    if (!duplicateTarget) return

    setDuplicating(duplicateTarget.id)
    setError(null)
    try {
      const response = await fetch(`/api/products/${duplicateTarget.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant })
      })

      if (!response.ok) {
        throw new Error('Error al duplicar el producto')
      }

      // Refresh page to show new product (or better, parent should handle update)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar.')
    } finally {
      setDuplicating(null)
      setDuplicateTarget(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedProduct(expandedProduct === id ? null : id)
  }

  // Rename state
  const [renamingUrl, setRenamingUrl] = useState<string | null>(null)
  const [newFilename, setNewFilename] = useState('')
  const [renamingProductId, setRenamingProductId] = useState<string | null>(null)
  const [renamingBusy, setRenamingBusy] = useState(false)
  const [optimizingUrl, setOptimizingUrl] = useState<string | null>(null)

  const openRenameModal = (productId: string, url: string) => {
    const currentFilename = url.split('/').pop() || ''
    setRenamingProductId(productId)
    setRenamingUrl(url)
    setNewFilename(decodeURIComponent(currentFilename))
  }

  const handleRenameSubmit = async () => {
    if (!renamingUrl || !newFilename.trim() || !renamingProductId) return

    setRenamingBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/media/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: renamingProductId,
          oldUrl: renamingUrl,
          newFilename: newFilename.trim()
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al renombrar la imagen')
      }

      // Refresh list
      onRefresh?.()

      setRenamingUrl(null)
      setNewFilename('')
      setRenamingProductId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo renombrar la imagen.')
    } finally {
      setRenamingBusy(false)
    }
  }

  const handleOptimize = async (productId: string, url: string) => {
    setOptimizingUrl(url)
    setError(null)
    try {
      const response = await fetch('/api/admin/media/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          url
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al optimizar la imagen')
      }

      // Refresh list
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo optimizar la imagen.')
    } finally {
      setOptimizingUrl(null)
    }
  }

  // Restore EXIF state
  const [restoringUrl, setRestoringUrl] = useState<string | null>(null)
  const [restoringProductId, setRestoringProductId] = useState<string | null>(null)
  const restoreExifInputRef = useRef<HTMLInputElement | null>(null)

  const handleRestoreExifClick = (productId: string, url: string) => {
    setRestoringProductId(productId)
    setRestoringUrl(url)
    restoreExifInputRef.current?.click()
  }

  const handleRestoreExifChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !restoringUrl || !restoringProductId) {
      setRestoringUrl(null)
      setRestoringProductId(null)
      return
    }

    // Use renamingBusy for loading state to avoid adding another state
    setRenamingBusy(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('productId', restoringProductId)
      formData.append('targetUrl', restoringUrl)
      formData.append('file', file)

      const response = await fetch('/api/admin/media/restore-exif', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al restaurar EXIF')
      }

      const meta = data.metadata
      const metaString = meta ?
        `EXIF Recuperado:\nDimensiones: ${meta.width}x${meta.height}\nFormato: ${meta.format}\nEXIF: ${meta.exif}` :
        'EXIF Recuperado correctamente'

      alert(metaString)

      // Refresh list
      onRefresh?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restaurar EXIF.')
    } finally {
      setRenamingBusy(false)
      setRestoringUrl(null)
      setRestoringProductId(null)
    }
  }

  // ... existing effects ...

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${activeTab === 'active'
            ? 'border-b-2 border-neutral-900 text-neutral-900'
            : 'text-neutral-400 hover:text-neutral-600'
            }`}
        >
          Activos
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${activeTab === 'archived'
            ? 'border-b-2 border-neutral-900 text-neutral-900'
            : 'text-neutral-400 hover:text-neutral-600'
            }`}
        >
          Archivados
        </button>
      </div>

      <input
        ref={restoreExifInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRestoreExifChange}
      />
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

      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
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
              <Fragment key={product.id}>
                <tr className={`${expandedProduct === product.id ? 'bg-neutral-50' : ''} ${!product.available ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-4 align-top text-sm font-semibold text-neutral-500">
                    #{formatOrder(product.priority)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="mt-1 text-neutral-400 hover:text-neutral-900"
                      >
                        {expandedProduct === product.id ? '▼' : '▶'}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                        {product.description && (
                          <p className="line-clamp-1 text-xs text-neutral-500">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                      {product.type?.split(' ')[0] || product.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-neutral-500">
                      {product.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-neutral-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        className="w-28 rounded-full border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0 disabled:opacity-60"
                        value={priceDrafts[product.id]?.value ?? product.price.toFixed(2)}
                        onChange={event => handlePriceChange(product.id, event.target.value)}
                        onKeyDown={event => handlePriceKeyDown(event, product.id)}
                        disabled={priceDrafts[product.id]?.saving}
                      />
                      <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">EUR</span>
                    </div>
                    {priceDrafts[product.id]?.error && (
                      <p className="mt-2 text-xs text-red-500">{priceDrafts[product.id]?.error}</p>
                    )}
                    {priceDrafts[product.id]?.success && !priceDrafts[product.id]?.dirty && (
                      <p className="mt-2 text-xs text-neutral-500">Precio actualizado.</p>
                    )}
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
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                          className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
                        >
                          Acciones ▼
                        </button>

                        {openMenuId === product.id && (
                          <div className="absolute right-0 top-full z-10 mt-2 w-48 flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-xl">
                            <button
                              type="button"
                              className="w-full px-4 py-3 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                              onClick={() => {
                                setOpenMenuId(null)
                                setTaggingProduct(product)
                              }}
                            >
                              Etiquetar
                            </button>
                            <button
                              type="button"
                              className="w-full px-4 py-3 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                              onClick={() => {
                                setOpenMenuId(null)
                                onEdit(product)
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="w-full px-4 py-3 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                              onClick={() => {
                                setOpenMenuId(null)
                                setDuplicateTarget(product)
                              }}
                            >
                              Duplicar
                            </button>
                            <button
                              type="button"
                              className={`w-full px-4 py-3 text-left text-xs font-medium hover:bg-neutral-50 ${product.available ? 'text-neutral-600 hover:text-neutral-900' : 'text-green-600 hover:bg-green-50 hover:text-green-700'}`}
                              onClick={() => {
                                setOpenMenuId(null)
                                if (product.metadata?.archived === true) {
                                  // If archived, we can Restore to Draft or Publish
                                  // This button will be "Publicar"
                                  onArchiveStatusChange(product.id, false, true)
                                } else {
                                  // If not archived
                                  if (product.available) {
                                    // If published -> Archive
                                    onArchiveStatusChange(product.id, true, false)
                                  } else {
                                    // If draft -> Publish
                                    onToggleAvailability(product.id, product.available)
                                  }
                                }
                              }}
                            >
                              {product.metadata?.archived === true ? 'Publicar' : (product.available ? 'Archivar' : 'Publicar')}
                            </button>
                            {/* Add Desarchivar option only for archived products */}
                            {product.metadata?.archived === true && (
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                onClick={() => {
                                  setOpenMenuId(null)
                                  // Restore to draft: archived=false, available=false
                                  onArchiveStatusChange(product.id, false, false)
                                }}
                              >
                                Mover a Borradores
                              </button>
                            )}
                            <button
                              type="button"
                              className="w-full border-t border-neutral-100 px-4 py-3 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleDelete(product.id)
                              }}
                              disabled={pendingDelete === product.id && deleting}
                            >
                              {pendingDelete === product.id && deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Backdrop to close menu */}
                      {openMenuId === product.id && (
                        <div
                          className="fixed inset-0 z-0"
                          onClick={() => setOpenMenuId(null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
                {expandedProduct === product.id && (
                  <tr className="bg-neutral-50">
                    <td colSpan={7} className="px-4 pb-6 pt-2">
                      <div className="ml-8 space-y-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {product.tags && product.tags.length > 0 ? (
                              product.tags.map(tag => (
                                <span key={tag} className="rounded bg-white px-2 py-1 text-xs text-neutral-600 border border-neutral-200">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400 italic">Sin tags</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">Galería ({product.gallery?.length || 0})</p>
                          <div className="flex flex-wrap gap-3">
                            {product.gallery && product.gallery.length > 0 ? (
                              product.gallery.map((url, idx) => {
                                const filename = url.split('/').pop() || 'imagen'
                                return (
                                  <div key={idx} className="flex flex-col gap-1 w-32 relative group/item z-0 hover:z-50">
                                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white group transition-all duration-200 hover:scale-[3] hover:shadow-2xl hover:cursor-zoom-in origin-top-left">
                                      <Image
                                        src={getProductImageVariant(url, 'thumb') || url}
                                        alt=""
                                        fill
                                        className="object-cover group-hover:object-contain group-hover:bg-white"
                                      />
                                      <button
                                        onClick={() => openRenameModal(product.id, url)}
                                        className="absolute right-1 top-1 hidden rounded-full bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-600 shadow hover:text-neutral-900 group-hover:block"
                                        title="Renombrar"
                                      >
                                        ✎
                                      </button>
                                      <div className="absolute left-1 top-1 flex flex-col gap-1">
                                        {!url.toLowerCase().endsWith('.webp') && (
                                          <button
                                            onClick={() => handleOptimize(product.id, url)}
                                            disabled={optimizingUrl === url}
                                            className="hidden rounded-full bg-amber-100/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-700 shadow hover:text-amber-900 group-hover:block disabled:opacity-70 disabled:cursor-wait"
                                            title="Optimizar a WebP"
                                          >
                                            {optimizingUrl === url ? '⏳' : '⚡'}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleRestoreExifClick(product.id, url)}
                                          className="hidden rounded-full bg-blue-100/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-700 shadow hover:text-blue-900 group-hover:block"
                                          title="Restaurar EXIF"
                                        >
                                          📷
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                      <span className="truncate text-[10px] text-neutral-500" title={filename}>{filename}</span>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <span className="text-xs text-neutral-400 italic">Sin imágenes</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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

      {/* Duplicate Modal */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">Duplicar &quot;{duplicateTarget.name}&quot;</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Elige el tipo de duplicado. Se copiará toda la información excepto las fotos.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleDuplicate('exact')}
                disabled={!!duplicating}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                <span className="font-medium">Copia exacta</span>
                <span className="text-xs text-neutral-500">Nombre (Copia)</span>
              </button>

              <button
                onClick={() => handleDuplicate('bordado')}
                disabled={!!duplicating}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                <span className="font-medium">Versión Bordado</span>
                <span className="text-xs text-neutral-500">+ &quot;Bordado&quot; en nombre y tags</span>
              </button>

              <button
                onClick={() => handleDuplicate('con-letra')}
                disabled={!!duplicating}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                <span className="font-medium">Versión con Letra</span>
                <span className="text-xs text-neutral-500">+ &quot;Con Letra&quot; en nombre y tags</span>
              </button>

              <button
                onClick={() => handleDuplicate('con-dos-letras')}
                disabled={!!duplicating}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                <span className="font-medium">Versión con dos Letras</span>
                <span className="text-xs text-neutral-500">+ &quot;Con dos Letras&quot; en nombre y tags</span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDuplicateTarget(null)}
                disabled={!!duplicating}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">Renombrar imagen</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Introduce el nuevo nombre para el archivo. Se mantendrán los tags y metadatos.
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none"
                placeholder="nombre-archivo.jpg"
                autoFocus
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRenamingUrl(null)
                  setRenamingProductId(null)
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={!newFilename.trim() || renamingBusy}
                className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {renamingBusy ? 'Renombrando...' : 'Renombrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {taggingProduct && (
        <ProductTaggingGalleryModal
          productName={taggingProduct.name}
          productId={taggingProduct.id}
          gallery={taggingProduct.gallery}
          onClose={() => setTaggingProduct(null)}
          onImagesUpdated={onRefresh}
        />
      )}
    </div>
  )
}

