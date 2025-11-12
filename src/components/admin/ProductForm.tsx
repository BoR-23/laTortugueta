'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AdminProductFormValues } from '@/types/admin'
import { listProductTypes, getProductTypeConfig, mergeTypeMetadata } from '@/lib/productTypes'

export type ProductFormValues = AdminProductFormValues

interface ProductFormProps {
  initialValues: ProductFormValues
  onSubmit: (values: ProductFormValues) => Promise<void>
  onSaveDraft?: (values: ProductFormValues) => Promise<void>
  onCancel: () => void
  mode: 'create' | 'edit'
  canSubmit?: boolean
  publishBlockedReason?: string
}

const parseList = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const buildInitialState = (input: ProductFormValues): ProductFormValues => ({
  ...input,
  metadata: mergeTypeMetadata(input.type, input.metadata ?? {})
})

export function ProductForm({
  initialValues,
  onSubmit,
  onSaveDraft,
  onCancel,
  mode,
  canSubmit = true,
  publishBlockedReason
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() => buildInitialState(initialValues))
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const productTypes = useMemo(() => listProductTypes(), [])
  const typeConfig = useMemo(() => getProductTypeConfig(values.type), [values.type])
  const metadata = values.metadata ?? {}
  const storyImagesInput = Array.isArray(metadata.storyImages)
    ? (metadata.storyImages as string[]).join(', ')
    : typeof metadata.storyImages === 'string'
      ? metadata.storyImages
      : ''

  useEffect(() => {
    setValues(buildInitialState(initialValues))
  }, [initialValues])

  const handleChange = (field: keyof ProductFormValues, value: unknown) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTypeChange = (nextType: string) => {
    setValues(prev => ({
      ...prev,
      type: nextType,
      metadata: mergeTypeMetadata(nextType, prev.metadata ?? {})
    }))
  }

  const handleMetadataChange = (fieldId: string, value: unknown) => {
    setValues(prev => ({
      ...prev,
      metadata: {
        ...(prev.metadata ?? {}),
        [fieldId]: value
      }
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft) {
      return
    }
    if (!values.id.trim()) {
      setError('Define un identificador antes de guardar un borrador.')
      return
    }
    setSavingDraft(true)
    setError(null)
    try {
      await onSaveDraft(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el borrador.')
    } finally {
      setSavingDraft(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Identificador (slug)
          <input
            type="text"
            value={values.id}
            onChange={event => handleChange('id', event.target.value)}
            required
            disabled={mode === 'edit'}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0 disabled:bg-neutral-100"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Nombre
          <input
            type="text"
            value={values.name}
            onChange={event => handleChange('name', event.target.value)}
            required
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>
      </div>

      <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
        Descripción
        <textarea
          value={values.description}
          onChange={event => handleChange('description', event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-3xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
        />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Categoría
          <input
            type="text"
            value={values.category}
            onChange={event => handleChange('category', event.target.value)}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>

        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Tipo de producto
          <select
            value={values.type}
            onChange={event => handleTypeChange(event.target.value)}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          >
            {productTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          {typeConfig.description && (
            <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-neutral-400">
              {typeConfig.description}
            </span>
          )}
        </label>

        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Color
          <input
            type="text"
            value={values.color}
            onChange={event => handleChange('color', event.target.value)}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Precio (EUR)
          <input
            type="number"
            step="0.01"
            value={values.price}
            onChange={event => handleChange('price', Number(event.target.value))}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>

        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Prioridad en el catálogo
          <input
            type="number"
            min={1}
            step="1"
            value={values.priority}
            onChange={event => handleChange('priority', Number(event.target.value) || 0)}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
          <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            1 aparece primero; los valores altos quedan al final.
          </span>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Tags (separados por coma)
          <input
            type="text"
            value={values.tags.join(', ')}
            onChange={event => handleChange('tags', parseList(event.target.value))}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>

        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Tallas (separadas por coma)
          <input
            type="text"
            value={values.sizes.join(', ')}
            onChange={event => handleChange('sizes', parseList(event.target.value))}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
        <input
          type="checkbox"
          checked={values.available}
          onChange={event => handleChange('available', event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        Disponible para catálogo
      </label>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Historia del calcetín (opcional)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Título destacado
            <input
              type="text"
              value={String(metadata.storyTitle ?? '')}
              onChange={event => handleMetadataChange('storyTitle', event.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Procedencia / contexto
            <input
              type="text"
              value={String(metadata.storyOrigin ?? '')}
              onChange={event => handleMetadataChange('storyOrigin', event.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
            />
          </label>
        </div>
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Coste o dificultad
          <input
            type="text"
            value={String(metadata.storyCost ?? '')}
            onChange={event => handleMetadataChange('storyCost', event.target.value)}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Relato
          <textarea
            rows={4}
            value={String(metadata.storyBody ?? '')}
            onChange={event => handleMetadataChange('storyBody', event.target.value)}
            className="mt-2 w-full rounded-3xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
            placeholder="Cuenta quién lo bordó, cuánto tardó o por qué es único."
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Fotos históricas (URLs separadas por coma)
          <input
            type="text"
            value={storyImagesInput}
            onChange={event => handleMetadataChange('storyImages', parseList(event.target.value))}
            className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
          />
          <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            Puedes enlazar imágenes antiguas almacenadas en Supabase u otra ubicación.
          </span>
        </label>
      </div>

      {typeConfig.formFields.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Campos específicos del tipo
          </p>
          <div className="space-y-4">
            {typeConfig.formFields.map(field => {
              const value = (values.metadata ?? {})[field.id] ?? ''
              const commonProps = {
                className:
                  'mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0',
                placeholder: field.placeholder ?? ''
              }
              return (
                <label
                  key={field.id}
                  className="block text-xs uppercase tracking-[0.3em] text-neutral-500"
                >
                  {field.label}
                  {field.type === 'textarea' ? (
                    <textarea
                      {...commonProps}
                      rows={3}
                      value={String(value ?? '')}
                      onChange={event => handleMetadataChange(field.id, event.target.value)}
                      className="mt-2 w-full rounded-3xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      {...commonProps}
                      value={String(value ?? '')}
                      onChange={event => handleMetadataChange(field.id, event.target.value)}
                    >
                      {(field.options ?? []).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...commonProps}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={String(value ?? '')}
                      onChange={event => handleMetadataChange(field.id, event.target.value)}
                    />
                  )}
                  {field.description && (
                    <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                      {field.description}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {onSaveDraft && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveDraft}
            disabled={saving || savingDraft}
          >
            {savingDraft ? 'Guardando borrador…' : 'Guardar borrador'}
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving || (mode === 'edit' && !canSubmit)}
        >
          {saving ? 'Guardando…' : mode === 'edit' ? 'Actualizar' : 'Crear producto'}
        </button>
      </div>
      {mode === 'edit' && !canSubmit && publishBlockedReason && (
        <p className="text-xs text-amber-600">{publishBlockedReason}</p>
      )}
    </form>
  )
}
