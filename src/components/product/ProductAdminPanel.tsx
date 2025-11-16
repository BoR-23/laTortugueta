'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/lib/products'

type Status = 'idle' | 'saving' | 'success' | 'error'

interface ProductAdminPanelProps {
  product: Product
  onPriceDisplayChange: (formattedValue: string) => void
}

const COLOR_REGEX = /^color\s+\d{3}$/i

const formatPrice = (value: number) => value.toFixed(2)

export default function ProductAdminPanel({ product, onPriceDisplayChange }: ProductAdminPanelProps) {
  const [priceInput, setPriceInput] = useState(formatPrice(product.price))
  const [priceStatus, setPriceStatus] = useState<Status>('idle')
  const [tagList, setTagList] = useState<string[]>(product.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [tagSaving, setTagSaving] = useState(false)
  const [tagError, setTagError] = useState<string | null>(null)
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [colorOptions, setColorOptions] = useState<string[]>([])
  const [selectedTagOption, setSelectedTagOption] = useState('')
  const [selectedColorOption, setSelectedColorOption] = useState('')

  useEffect(() => {
    setPriceInput(formatPrice(product.price))
  }, [product.price])

  useEffect(() => {
    setTagList(product.tags || [])
  }, [product.tags])

  useEffect(() => {
    let cancelled = false
    const loadOptions = async () => {
      try {
        const response = await fetch('/api/tags')
        if (!response.ok) return
        const payload = (await response.json()) as { tags?: string[] }
        if (cancelled || !payload?.tags) return
        const tags = payload.tags
        const colors = tags
          .filter(tag => COLOR_REGEX.test(tag))
          .sort((a, b) => a.localeCompare(b, 'es'))
        const general = tags.filter(tag => !COLOR_REGEX.test(tag)).sort((a, b) => a.localeCompare(b, 'es'))
        setColorOptions(colors)
        setTagOptions(general)
      } catch {
        // ignore
      }
    }
    loadOptions()
    return () => {
      cancelled = true
    }
  }, [])

  const handlePriceSave = async () => {
    const parsed = Number(priceInput)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceStatus('error')
      return
    }
    setPriceStatus('saving')
    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, price: parsed })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudo actualizar el precio.')
      }
      const formatted = formatPrice(parsed)
      setPriceInput(formatted)
      onPriceDisplayChange(formatted)
      setPriceStatus('success')
    } catch (error) {
      console.error(error)
      setPriceStatus('error')
    }
  }

  const handleResetPriceInput = () => {
    const formatted = formatPrice(product.price)
    setPriceInput(formatted)
    onPriceDisplayChange(formatted)
    setPriceStatus('idle')
  }

  const persistTags = async (nextTags: string[]) => {
    setTagSaving(true)
    setTagError(null)
    try {
      const response = await fetch(`/api/products/${product.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: nextTags })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudieron guardar las etiquetas.')
      }
      setTagList(nextTags)
    } catch (error) {
      console.error(error)
      setTagError('No se pudieron guardar las etiquetas.')
    } finally {
      setTagSaving(false)
    }
  }

  const handleAddTag = async (value: string) => {
    if (!value) return
    if (tagList.some(tag => tag.toLowerCase() === value.toLowerCase())) {
      return
    }
    await persistTags([...tagList, value])
  }

  const handleColorSelect = async (value: string) => {
    if (!value) return
    setSelectedColorOption(value)
    await handleAddTag(value)
    setSelectedColorOption('')
  }

  const handleTagSelect = async (value: string) => {
    if (!value) return
    setSelectedTagOption(value)
    await handleAddTag(value)
    setSelectedTagOption('')
  }

  const handleTagSubmit = async () => {
    const value = tagInput.trim()
    if (!value) return
    await handleAddTag(value)
    setTagInput('')
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    await persistTags(tagList.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Actualizar precio</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={event => setPriceInput(event.target.value)}
              className="w-32 rounded-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
            />
            <button
              type="button"
              onClick={handlePriceSave}
              className="rounded-full border border-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-50"
              disabled={priceStatus === 'saving'}
            >
              {priceStatus === 'saving' ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleResetPriceInput}
              className="text-xs uppercase tracking-[0.3em] text-neutral-500 underline"
            >
              Reset
            </button>
          </div>
          {priceStatus === 'error' && (
            <p className="mt-2 text-xs text-red-500">Introduce un valor válido.</p>
          )}
          {priceStatus === 'success' && (
            <p className="mt-2 text-xs text-emerald-600">Precio actualizado.</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Etiquetas del calcetín</p>
          <p className="mt-1 text-xs text-neutral-500">
            Añade palabras clave sencillas para agrupar calcetines (ej. colores, colecciones, usos). Haz clic en una
            etiqueta para eliminarla.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tagList.length > 0 ? (
            tagList.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="rounded-full border border-neutral-400 bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-800 hover:border-neutral-900 hover:bg-white"
                disabled={tagSaving}
              >
                {tag} ×
              </button>
            ))
          ) : (
            <span className="text-xs text-neutral-500">Todavía no hay etiquetas.</span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Elegir color disponible
            <select
              value={selectedColorOption}
              onChange={event => handleColorSelect(event.target.value)}
              className="mt-1 w-full rounded-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
              disabled={tagSaving || colorOptions.length === 0}
            >
              <option value="">Selecciona un color</option>
              {colorOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Elegir etiqueta frecuente
            <select
              value={selectedTagOption}
              onChange={event => handleTagSelect(event.target.value)}
              className="mt-1 w-full rounded-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
              disabled={tagSaving || tagOptions.length === 0}
            >
              <option value="">Selecciona etiqueta</option>
              {tagOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={tagInput}
            onChange={event => setTagInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleTagSubmit()
              }
            }}
            placeholder="Ej: color 301, rayas, ceremonia"
            className="flex-1 rounded-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
            disabled={tagSaving}
          />
          <button
            type="button"
            onClick={() => void handleTagSubmit()}
            disabled={tagSaving || !tagInput.trim()}
            className="rounded-full border border-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-50"
          >
            Añadir etiqueta
          </button>
        </div>
        {tagError && <p className="text-xs text-red-500">{tagError}</p>}
        {tagSaving && <p className="text-xs text-neutral-500">Guardando…</p>}
      </div>
    </div>
  )
}
