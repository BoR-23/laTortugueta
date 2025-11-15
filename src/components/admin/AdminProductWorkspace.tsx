'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProductList } from './ProductList'
import { ProductForm } from './ProductForm'
import { PricingManager } from './PricingManager'
import { MediaGalleryManager } from './MediaGalleryManager.client'
import { CatalogOrderManager } from './CatalogOrderManager'
import { ProductPerformancePanel } from './ProductPerformancePanel'
import { SiteSettingsPanel } from './SiteSettingsPanel'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'
import { ProductDraftPreview, type DraftDiffEntry } from './ProductDraftPreview'
import {
  PublicationChecklist,
  defaultChecklistState
} from './PublicationChecklist'
import type { AdminProductFormValues } from '@/types/admin'
import type { SiteSettings } from '@/lib/settings'
import {
  DEFAULT_PRODUCT_TYPE,
  getProductTypeConfig,
  mergeTypeMetadata,
  sanitizeTypeMetadata,
  formatMetadataValue
} from '@/lib/productTypes'
import { inferProductTypeFromCategory } from '@/lib/categoryMappings'
import { extractProductPlaceholderMap } from '@/lib/images'

interface AdminProductWorkspaceProps {
  initialProducts: AdminProductFormValues[]
  initialSettings: SiteSettings
}

const blankProduct: AdminProductFormValues = {
  id: '',
  name: '',
  description: '',
  category: '',
  type: DEFAULT_PRODUCT_TYPE,
  color: '',
  price: 0,
  priority: DEFAULT_PRODUCT_PRIORITY,
  tags: [],
  sizes: [],
  available: false,
  gallery: [],
  metadata: mergeTypeMetadata(DEFAULT_PRODUCT_TYPE, {}) as AdminProductFormValues['metadata']
}

const priorityOf = (value?: number) =>
  typeof value === 'number' ? value : DEFAULT_PRODUCT_PRIORITY

const sortByPriority = (items: AdminProductFormValues[]) =>
  [...items].sort((a, b) => {
    const diff = priorityOf(a.priority) - priorityOf(b.priority)
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'es')
  })

const mapApiProductToFormValues = (payload: Record<string, any>): AdminProductFormValues => {
  const type =
    typeof payload.type === 'string' && payload.type.trim().length > 0
      ? payload.type.trim()
      : inferProductTypeFromCategory(payload.category)
  const metadata = mergeTypeMetadata(type, payload.metadata ?? {}) as AdminProductFormValues['metadata']
  return {
    id: payload.id,
    name: payload.name ?? '',
    description: payload.description ?? '',
    category: payload.category ?? '',
    type,
    color: payload.color ?? '',
    price: Number(payload.price ?? 0),
    priority: priorityOf(payload.priority),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    sizes: Array.isArray(payload.sizes) ? payload.sizes : [],
    available: Boolean(payload.available),
    gallery: Array.isArray(payload.gallery) ? payload.gallery : [],
    metadata
  }
}

type DraftInfo = {
  values: AdminProductFormValues
  updatedAt: string
  actor?: {
    email?: string | null
    name?: string | null
  }
}

const diffFields: Array<{
  key: keyof AdminProductFormValues
  label: string
  formatter?: (value: unknown) => string
}> = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción' },
  { key: 'category', label: 'Categoría' },
  { key: 'type', label: 'Tipo de producto' },
  { key: 'color', label: 'Color' },
  {
    key: 'price',
    label: 'Precio',
    formatter: value =>
      typeof value === 'number' ? `${value.toFixed(2)} EUR` : String(value ?? '')
  },
  { key: 'priority', label: 'Prioridad' },
  {
    key: 'tags',
    label: 'Tags',
    formatter: value => (Array.isArray(value) ? value.join(', ') : '')
  },
  {
    key: 'sizes',
    label: 'Tallas',
    formatter: value => (Array.isArray(value) ? value.join(', ') : '')
  },
  {
    key: 'available',
    label: 'Disponibilidad',
    formatter: value => (value ? 'Disponible' : 'Oculto')
  }
]

const formatValue = (key: keyof AdminProductFormValues, value: unknown) => {
  if (key === 'metadata') {
    return ''
  }
  const entry = diffFields.find(field => field.key === key)
  if (entry?.formatter) {
    return entry.formatter(value)
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  return String(value ?? '')
}

const buildDraftDiff = (
  published: AdminProductFormValues,
  draft: AdminProductFormValues
): DraftDiffEntry[] => {
  const baseDiffs = diffFields
    .filter(field => field.key !== 'metadata')
    .map(field => {
      const currentValue = published[field.key]
      const draftValue = draft[field.key]

      const areEqual =
        JSON.stringify(currentValue ?? '') === JSON.stringify(draftValue ?? '')

      if (areEqual) {
        return null
      }

      return {
        field: String(field.key),
        label: field.label,
        currentValue: formatValue(field.key, currentValue),
        draftValue: formatValue(field.key, draftValue)
      }
    })
    .filter(Boolean) as DraftDiffEntry[]

  const metadataDiffs: DraftDiffEntry[] = []
  const publishedConfig = getProductTypeConfig(published.type)
  const draftConfig = getProductTypeConfig(draft.type)
  const metadataFieldIds = new Set<string>()
  publishedConfig.formFields.forEach(field => metadataFieldIds.add(field.id))
  draftConfig.formFields.forEach(field => metadataFieldIds.add(field.id))

  metadataFieldIds.forEach(fieldId => {
    const currentValue = published.metadata?.[fieldId]
    const draftValue = draft.metadata?.[fieldId]
    const areEqual =
      JSON.stringify(currentValue ?? '') === JSON.stringify(draftValue ?? '')
    if (areEqual) {
      return
    }

    const draftField = draftConfig.formFields.find(field => field.id === fieldId)
    const publishedField = publishedConfig.formFields.find(field => field.id === fieldId)
    const labelSource = draftField ?? publishedField
    const typeLabel =
      draftField && !publishedField
        ? draftConfig.label
        : !draftField && publishedField
          ? publishedConfig.label
          : draftConfig.label
    const label = labelSource ? `${labelSource.label} (${typeLabel})` : fieldId

    metadataDiffs.push({
      field: `metadata.${fieldId}`,
      label,
      currentValue: formatMetadataValue(published.type, fieldId, currentValue),
      draftValue: formatMetadataValue(draft.type, fieldId, draftValue)
    })
  })

  return [...baseDiffs, ...metadataDiffs]
}

const mapDraftResponse = (payload: any): DraftInfo => ({
  values: mapApiProductToFormValues(payload?.values ?? {}),
  updatedAt: payload?.updatedAt ?? new Date().toISOString(),
  actor: payload?.actor ?? null
})

export function AdminProductWorkspace({ initialProducts, initialSettings }: AdminProductWorkspaceProps) {
  const [products, setProducts] = useState<AdminProductFormValues[]>(sortByPriority(initialProducts))
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSettings)
  const [selectedProduct, setSelectedProduct] = useState<AdminProductFormValues | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [globalMessage, setGlobalMessage] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [draftInfo, setDraftInfo] = useState<DraftInfo | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [draftActionError, setDraftActionError] = useState<string | null>(null)
  const [draftActionLoading, setDraftActionLoading] = useState<'discard' | null>(null)
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(defaultChecklistState())

  const fetchDraftForProduct = async (productId: string) => {
    const response = await fetch(`/api/products/${productId}/draft`, { cache: 'no-store' })
    if (response.status === 404) {
      return null
    }
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error ?? 'No se pudo cargar el borrador.')
    }
    return data ? mapDraftResponse(data) : null
  }

  useEffect(() => {
    if (!selectedProduct) {
      setDraftInfo(null)
      setDraftError(null)
      setChecklistState(defaultChecklistState())
      return
    }
    let canceled = false
    setDraftLoading(true)
    setDraftError(null)
    fetchDraftForProduct(selectedProduct.id)
      .then(result => {
        if (canceled) return
        setDraftInfo(result)
      })
      .catch(error => {
        if (canceled) return
        setDraftInfo(null)
        setDraftError(error instanceof Error ? error.message : 'No se pudo cargar el borrador.')
      })
      .finally(() => {
        if (canceled) return
        setDraftLoading(false)
      })
    return () => {
      canceled = true
    }
  }, [selectedProduct?.id])

  const productForForm = selectedProduct ?? blankProduct
  const productPlaceholderMap = extractProductPlaceholderMap(productForForm.metadata)
  const formMode = selectedProduct ? 'edit' : 'create'

  const pricingRows = useMemo(
    () =>
      products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category || 'Catálogo'
      })),
    [products]
  )

  const draftDiffEntries = useMemo(() => {
    if (!draftInfo || !selectedProduct) {
      return []
    }
    return buildDraftDiff(selectedProduct, draftInfo.values)
  }, [draftInfo, selectedProduct])

  const checklistComplete = useMemo(
    () => Object.values(checklistState).every(Boolean),
    [checklistState]
  )

  const upsertProductInState = (next: AdminProductFormValues) => {
    setProducts(current => {
      const exists = current.some(product => product.id === next.id)
      if (exists) {
        return sortByPriority(
          current.map(product => (product.id === next.id ? next : product))
        )
      }
      return sortByPriority([...current, next])
    })
  }

  const handleSubmit = async (values: AdminProductFormValues) => {
    setGlobalError(null)
    setGlobalMessage(null)

    const endpoint =
      formMode === 'edit' ? `/api/products/${values.id}` : '/api/products'
    const method = formMode === 'edit' ? 'PUT' : 'POST'

    const payload = {
      ...values,
      metadata: sanitizeTypeMetadata(values.type, values.metadata ?? {})
    }
    delete (payload as Partial<AdminProductFormValues>).gallery

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error ?? 'No se pudo guardar el producto.')
    }

    const data = await response.json()
    const mapped = mapApiProductToFormValues(data)
    upsertProductInState(mapped)
    setSelectedProduct(mapped)
    setGlobalMessage(formMode === 'edit' ? 'Producto actualizado.' : 'Producto creado.')
  }

  const handleCancel = () => {
    setSelectedProduct(null)
    setGlobalError(null)
    setGlobalMessage(null)
    setChecklistState(defaultChecklistState())
    setPanelOpen(false)
  }

  const handleEdit = (product: AdminProductFormValues) => {
    setSelectedProduct(product)
    setGlobalError(null)
    setGlobalMessage(null)
    setChecklistState(defaultChecklistState())
    setPanelOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedProduct(null)
    setGlobalError(null)
    setGlobalMessage(null)
    setChecklistState(defaultChecklistState())
    setPanelOpen(true)
  }

  const handleDelete = async (id: string) => {
    setGlobalError(null)
    setGlobalMessage(null)
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error ?? 'No se pudo eliminar.')
    }
    setProducts(current => current.filter(product => product.id !== id))
    if (selectedProduct?.id === id) {
      setSelectedProduct(null)
      setPanelOpen(false)
    }
    setGlobalMessage('Producto eliminado.')
  }

const handleGalleryChange = (productId: string, gallery: string[]) => {
  setProducts(current =>
    current.map(product =>
      product.id === productId ? { ...product, gallery } : product
    )
  )
  if (selectedProduct?.id === productId) {
    setSelectedProduct({ ...selectedProduct, gallery })
  }
}

const handlePlaceholderChange = (productId: string, placeholders: Record<string, string>) => {
  setProducts(current =>
    current.map(product =>
      product.id === productId
        ? {
            ...product,
            metadata: {
              ...(product.metadata ?? {}),
              imagePlaceholders: placeholders
            }
          }
        : product
    )
  )

  if (selectedProduct?.id === productId) {
    setSelectedProduct({
      ...selectedProduct,
      metadata: {
        ...(selectedProduct.metadata ?? {}),
        imagePlaceholders: placeholders
      }
    })
  }
}

  const handleInlinePriceUpdate = async (productId: string, price: number) => {
    setGlobalError(null)
    const response = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, price })
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error ?? 'No se pudo actualizar el precio.')
    }
    setProducts(current =>
      current.map(product => (product.id === productId ? { ...product, price } : product))
    )
    if (selectedProduct?.id === productId) {
      setSelectedProduct({ ...selectedProduct, price })
    }
  }

  const handleSaveDraft = async (values: AdminProductFormValues) => {
    if (!values.id.trim()) {
      throw new Error('Define un identificador antes de guardar el borrador.')
    }
    setGlobalError(null)
    setGlobalMessage(null)
    setDraftActionError(null)
    try {
      const response = await fetch(`/api/products/${values.id}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: {
            ...values,
            metadata: sanitizeTypeMetadata(values.type, values.metadata ?? {})
          }
        })
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? 'No se pudo guardar el borrador.')
      }
      if (data) {
        setDraftInfo(mapDraftResponse(data))
      }
      setGlobalMessage('Borrador guardado (sin publicar).')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el borrador.'
      setGlobalError(message)
      throw error
    }
  }

  const handleApplyDraft = () => {
    if (!draftInfo) {
      return
    }
    setDraftActionError(null)
    const mergedMetadata = mergeTypeMetadata(
      draftInfo.values.type,
      draftInfo.values.metadata ?? {}
    )
    setSelectedProduct({
      ...draftInfo.values,
      metadata: mergedMetadata,
      gallery: draftInfo.values.gallery ?? selectedProduct?.gallery ?? []
    })
    setGlobalMessage('Borrador cargado en el formulario. Pulsa "Actualizar" para publicar.')
  }

  const handleDiscardDraft = async () => {
    if (!draftInfo) {
      return
    }
    setDraftActionError(null)
    setDraftActionLoading('discard')
    try {
      const response = await fetch(`/api/products/${draftInfo.values.id}/draft`, {
        method: 'DELETE'
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? 'No se pudo eliminar el borrador.')
      }
      setDraftInfo(null)
      setGlobalMessage('Borrador descartado.')
    } catch (error) {
      setDraftActionError(
        error instanceof Error ? error.message : 'No se pudo eliminar el borrador.'
      )
    } finally {
      setDraftActionLoading(null)
    }
  }

  const handlePrioritiesUpdated = (updates: { id: string; priority: number }[]) => {
    setProducts(current =>
      sortByPriority(
        current.map(product => {
          const update = updates.find(entry => entry.id === product.id)
          return update ? { ...product, priority: update.priority } : product
        })
      )
    )
    if (selectedProduct) {
      const update = updates.find(entry => entry.id === selectedProduct.id)
      if (update) {
        setSelectedProduct({ ...selectedProduct, priority: update.priority })
      }
    }
  }

  return (
    <>
      {(globalMessage || globalError) && (
        <div
          className={`mt-6 rounded-3xl border px-4 py-3 text-sm ${
            globalError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {globalError ?? globalMessage}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Productos actuales
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Administra el catálogo completo: crea, edita o elimina productos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateNew}
                className="self-start rounded-full border border-neutral-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                Nuevo producto
              </button>
            </div>
            <div className="mt-6">
            <ProductList
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPriceUpdate={handleInlinePriceUpdate}
            />
            </div>
          </section>

          <CatalogOrderManager
            products={products}
            onPrioritiesUpdated={handlePrioritiesUpdated}
          />

          <section className="rounded-3xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
              Gestor de precios
            </h2>
            <div className="mt-6">
              <PricingManager products={pricingRows} />
            </div>
          </section>
        </div>
        <div className="space-y-10">
          <SiteSettingsPanel initialSettings={siteSettings} onChange={setSiteSettings} />
          <ProductPerformancePanel
            products={products}
            onInspect={productId => {
              const target = products.find(product => product.id === productId)
              if (target) {
                handleEdit(target)
              }
            }}
          />
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={handleCancel} aria-hidden="true" />
          <div className="relative z-50 h-full w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                  {formMode === 'edit' ? 'Editar producto' : 'Crear nuevo producto'}
                </p>
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {selectedProduct?.name || 'Nuevo producto'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <ProductForm
                key={productForForm.id || 'new'}
                initialValues={productForForm}
                mode={formMode}
                canSubmit={checklistComplete}
                publishBlockedReason={
                  !checklistComplete
                    ? 'Completa la checklist antes de publicar los cambios.'
                    : undefined
                }
                onSaveDraft={handleSaveDraft}
                onCancel={handleCancel}
                onSubmit={async values => {
                  try {
                    await handleSubmit(values)
                  } catch (error) {
                    setGlobalError(error instanceof Error ? error.message : 'Error inesperado.')
                    throw error
                  }
                }}
              />

              <PublicationChecklist
                value={checklistState}
                onChange={setChecklistState}
                disabled={!selectedProduct}
              />

              {draftLoading && selectedProduct && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
                  Buscando borradores guardados…
                </div>
              )}
              {draftError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {draftError}
                </div>
              )}
              {draftInfo && selectedProduct && (
                <div>
                  <ProductDraftPreview
                    draft={draftInfo}
                    diffEntries={draftDiffEntries}
                    onApplyDraft={handleApplyDraft}
                    onDiscardDraft={handleDiscardDraft}
                    discarding={draftActionLoading === 'discard'}
                    error={draftActionError}
                  />
                </div>
              )}

              <MediaGalleryManager
                productId={productForForm.id}
                initialGallery={productForForm.gallery}
                initialPlaceholders={productPlaceholderMap}
                disabled={!selectedProduct}
                onGalleryChange={gallery => handleGalleryChange(productForForm.id, gallery)}
                onPlaceholdersChange={placeholders =>
                  handlePlaceholderChange(productForForm.id, placeholders)
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
