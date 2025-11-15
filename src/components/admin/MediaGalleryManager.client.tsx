'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { buildProductPlaceholderMap, getProductImageVariant } from '@/lib/images'
import { uploadProductImage } from '@/lib/client/uploadProductImage'

type PlaceholderMap = Record<string, string>

type MediaGalleryManagerProps = {
  productId: string
  initialGallery: string[]
  initialPlaceholders?: PlaceholderMap
  onGalleryChange: (gallery: string[]) => void
  onPlaceholdersChange?: (placeholders: PlaceholderMap) => void
  disabled?: boolean
}

export function MediaGalleryManager(props: MediaGalleryManagerProps) {
  const {
    productId,
    initialGallery,
    initialPlaceholders = {},
    onGalleryChange,
    onPlaceholdersChange,
    disabled
  } = props

  const [gallery, setGallery] = useState(initialGallery)
  const [placeholders, setPlaceholders] = useState<PlaceholderMap>(initialPlaceholders)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingReplaceIndex, setPendingReplaceIndex] = useState<number | null>(null)
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null)
  const addInputRef = useRef<HTMLInputElement | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setGallery(initialGallery)
  }, [initialGallery])

  useEffect(() => {
    setPlaceholders(initialPlaceholders)
  }, [initialPlaceholders])

  const syncGallery = async (
    nextGallery: string[],
    additions: PlaceholderMap = {}
  ) => {
    setBusy(true)
    try {
      const nextPlaceholders = buildProductPlaceholderMap(nextGallery, placeholders, additions)
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: nextGallery.map((url, index) => ({ url, position: index })),
          placeholders: nextPlaceholders
        })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudo sincronizar la galería.')
      }
      setGallery(nextGallery)
      setPlaceholders(nextPlaceholders)
      onGalleryChange(nextGallery)
      onPlaceholdersChange?.(nextPlaceholders)
      setError(null)
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const result = await uploadProductImage(productId, file)
      await syncGallery([...gallery, result.path], { [result.path]: result.placeholder })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron subir las imágenes.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !productId) return
    void handleUpload(file)
  }

  const handleReplaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const targetIndex = pendingReplaceIndex
    setPendingReplaceIndex(null)
    if (!file || targetIndex === null) return

    setReplacingIndex(targetIndex)
    setError(null)
    ;(async () => {
      try {
        const result = await uploadProductImage(productId, file)
        const nextGallery = [...gallery]
        nextGallery[targetIndex] = result.path
        await syncGallery(nextGallery, { [result.path]: result.placeholder })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo reemplazar la imagen.')
      } finally {
        setReplacingIndex(null)
      }
    })()
  }

  const handleRemove = async (url: string) => {
    const nextGallery = gallery.filter(item => item !== url)
    try {
      await syncGallery(nextGallery)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galería.')
    }
  }

  const handleSetFeatured = async (index: number) => {
    if (index === 0) return
    const nextGallery = [...gallery]
    const [entry] = nextGallery.splice(index, 1)
    nextGallery.unshift(entry)
    try {
      await syncGallery(nextGallery)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galería.')
    }
  }

  const openReplacePicker = (index: number) => {
    setPendingReplaceIndex(index)
    replaceInputRef.current?.click()
  }

  const isDisabled = disabled || !productId

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6">
      <input
        ref={addInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAddChange}
        disabled={busy}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceChange}
        disabled={busy}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">Galería de imágenes</h2>
          <p className="text-xs text-neutral-500">
            Las fotos se suben y optimizan automáticamente (WebP en varias resoluciones).
          </p>
        </div>
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          disabled={isDisabled || busy}
          className="rounded-full border border-neutral-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-50"
        >
          {busy ? 'Procesando…' : 'Subir imagen'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 grid gap-4">
        {gallery.length === 0 && !isDisabled && (
          <p className="text-sm text-neutral-500">Todavía no hay fotos asociadas.</p>
        )}
        {gallery.map((url, index) => {
          const displayUrl = getProductImageVariant(url, 'original') || url
          const previewPlaceholder = placeholders[url]
          return (
            <div
              key={`${url}-${index}`}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
            >
              <div className="relative h-20 w-16 overflow-hidden rounded-xl bg-white">
                {url ? (
                  <Image
                    src={displayUrl}
                    alt={productId}
                    fill
                    className="object-cover"
                    sizes="64px"
                    placeholder={previewPlaceholder ? 'blur' : 'empty'}
                    blurDataURL={previewPlaceholder}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">Sin imagen</div>
                )}
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => openReplacePicker(index)}
                    disabled={busy || replacingIndex === index}
                    className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-600 shadow hover:text-neutral-900 disabled:opacity-50"
                  >
                    {replacingIndex === index ? '…' : '✎'}
                  </button>
                )}
              </div>
              <div className="flex-1 break-all text-xs text-neutral-600">{url}</div>
              {!isDisabled && (
                <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  <button
                    type="button"
                    onClick={() => handleSetFeatured(index)}
                    className="rounded-full border border-neutral-300 px-3 py-1 hover:border-neutral-900 hover:text-neutral-900"
                  >
                    Destacar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(url)}
                    className="rounded-full border border-red-200 px-3 py-1 text-red-500 hover:border-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
