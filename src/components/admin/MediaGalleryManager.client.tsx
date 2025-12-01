'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { buildProductPlaceholderMap, getProductImageVariant } from '@/lib/images'
import { uploadProductImage } from '@/lib/client/uploadProductImage'
import { ImageTaggingModal } from './ImageTaggingModal'

type PlaceholderMap = Record<string, string>

type MediaGalleryManagerProps = {
  productId: string
  initialGallery: string[]
  initialPlaceholders?: PlaceholderMap
  initialReviewMap?: Record<string, boolean>
  onGalleryChange: (gallery: string[]) => void
  onPlaceholdersChange?: (placeholders: PlaceholderMap) => void
  onReviewChange?: (reviewMap: Record<string, boolean>) => void
  disabled?: boolean
}

export function MediaGalleryManager(props: MediaGalleryManagerProps) {
  const {
    productId,
    initialGallery,
    initialPlaceholders = {},
    initialReviewMap = {},
    onGalleryChange,
    onPlaceholdersChange,
    onReviewChange,
    disabled
  } = props

  const [gallery, setGallery] = useState(initialGallery)
  const [placeholders, setPlaceholders] = useState<PlaceholderMap>(initialPlaceholders)
  const [reviewMap, setReviewMap] = useState<Record<string, boolean>>(initialReviewMap)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingReplaceIndex, setPendingReplaceIndex] = useState<number | null>(null)
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const addInputRef = useRef<HTMLInputElement | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)

  // Move functionality state
  const [movingUrl, setMovingUrl] = useState<string | null>(null)
  const [taggingUrl, setTaggingUrl] = useState<string | null>(null)
  const [targetProductId, setTargetProductId] = useState<string>('')
  const [availableProducts, setAvailableProducts] = useState<{ id: string, name: string }[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setAvailableProducts(data.map((p: any) => ({ id: p.id, name: p.name })))
      }
    } catch (e) {
      console.error('Failed to load products', e)
    } finally {
      setLoadingProducts(false)
    }
  }

  const openMoveModal = (url: string) => {
    setMovingUrl(url)
    setTargetProductId('')
    if (availableProducts.length === 0) {
      void fetchProducts()
    }
  }

  const handleMoveSubmit = async () => {
    if (!movingUrl || !targetProductId) return

    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/media/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetUrl: movingUrl,
          targetProductId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al mover la imagen')
      }

      // Remove from current gallery
      const nextGallery = gallery.filter(item => item !== movingUrl)
      const nextReview = { ...reviewMap }
      delete nextReview[movingUrl]

      setGallery(nextGallery)
      setReviewMap(nextReview)
      onGalleryChange(nextGallery)
      onReviewChange?.(nextReview)

      setMovingUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo mover la imagen.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    setGallery(initialGallery)
  }, [initialGallery])

  useEffect(() => {
    setPlaceholders(initialPlaceholders)
  }, [initialPlaceholders])

  useEffect(() => {
    setReviewMap(initialReviewMap)
  }, [initialReviewMap])

  const syncGallery = async (
    nextGallery: string[],
    additions: PlaceholderMap = {},
    nextReview: Record<string, boolean> = reviewMap
  ) => {
    setBusy(true)
    try {
      const nextPlaceholders = buildProductPlaceholderMap(nextGallery, placeholders, additions)
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: nextGallery.map((url, index) => ({ url, position: index })),
          placeholders: nextPlaceholders,
          reviewed: nextReview
        })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudo sincronizar la galería.')
      }
      setGallery(nextGallery)
      setPlaceholders(nextPlaceholders)
      setReviewMap(nextReview)
      onGalleryChange(nextGallery)
      onPlaceholdersChange?.(nextPlaceholders)
      onReviewChange?.(nextReview)
      setError(null)
    } finally {
      setBusy(false)
    }
  }

  const handleUploadMultiple = async (files: File[]) => {
    if (!files.length) return
    setBusy(true)
    setError(null)
    try {
      const additions: PlaceholderMap = {}
      const nextGallery = [...gallery]
      const nextReview: Record<string, boolean> = { ...reviewMap }
      for (const file of files) {
        const result = await uploadProductImage(productId, file)
        nextGallery.push(result.path)
        additions[result.path] = result.placeholder
        // nuevo asset marcado como no revisado por defecto
        nextReview[result.path] = false
      }
      await syncGallery(nextGallery, additions, nextReview)
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
    void handleUploadMultiple([file])
  }

  const handleReplaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const targetIndex = pendingReplaceIndex
    setPendingReplaceIndex(null)
    if (!file || targetIndex === null) return

    setReplacingIndex(targetIndex)
    setError(null)
      ; (async () => {
        try {
          const currentUrl = gallery[targetIndex]
          const filenameMatch = currentUrl.split('/').pop()
          const targetFilename = filenameMatch ? decodeURIComponent(filenameMatch) : undefined

          const result = await uploadProductImage(productId, file, targetFilename)
          const nextGallery = [...gallery]
          nextGallery[targetIndex] = result.path
          const nextReview: Record<string, boolean> = { ...reviewMap }
          // al reemplazar, marcar como no revisado hasta revisar de nuevo
          nextReview[result.path] = false
          await syncGallery(nextGallery, { [result.path]: result.placeholder }, nextReview)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'No se pudo reemplazar la imagen.')
        } finally {
          setReplacingIndex(null)
        }
      })()
  }

  const handleRemove = async (url: string) => {
    const nextGallery = gallery.filter(item => item !== url)
    const nextReview = { ...reviewMap }
    delete nextReview[url]
    try {
      await syncGallery(nextGallery, {}, nextReview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galería.')
    }
  }

  const handleSetFeatured = async (index: number) => {
    if (index === 0) return
    const nextGallery = [...gallery]
    const [entry] = nextGallery.splice(index, 1)
    nextGallery.unshift(entry)
    const nextReview: Record<string, boolean> = {}
    nextGallery.forEach(url => {
      nextReview[url] = reviewMap[url] ?? false
    })
    try {
      await syncGallery(nextGallery, {}, nextReview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galería.')
    }
  }

  const handleToggleReview = async (url: string) => {
    const nextReview = { ...reviewMap, [url]: !reviewMap[url] }
    try {
      await syncGallery(gallery, {}, nextReview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galería.')
    }
  }

  const openReplacePicker = (index: number) => {
    setPendingReplaceIndex(index)
    replaceInputRef.current?.click()
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (isDisabled || busy) return
    event.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (isDisabled || busy) return
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files || []).filter(file => file.type.startsWith('image/'))
    if (!files.length) return
    void handleUploadMultiple(files)
  }

  const isDisabled = disabled || !productId



  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null)

  const [renamingUrl, setRenamingUrl] = useState<string | null>(null)
  const [newFilename, setNewFilename] = useState('')

  const openRenameModal = (url: string) => {
    const currentFilename = url.split('/').pop() || ''
    setRenamingUrl(url)
    setNewFilename(decodeURIComponent(currentFilename))
  }

  const handleRenameSubmit = async () => {
    if (!renamingUrl || !newFilename.trim()) return

    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/media/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          oldUrl: renamingUrl,
          newFilename: newFilename.trim()
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al renombrar la imagen')
      }

      // Update local state
      const nextGallery = gallery.map(url => (url === renamingUrl ? data.newUrl : url))
      const nextReview = { ...reviewMap }
      if (nextReview[renamingUrl] !== undefined) {
        nextReview[data.newUrl] = nextReview[renamingUrl]
        delete nextReview[renamingUrl]
      }
      const nextPlaceholders = { ...placeholders }
      if (nextPlaceholders[renamingUrl]) {
        nextPlaceholders[data.newUrl] = nextPlaceholders[renamingUrl]
        delete nextPlaceholders[renamingUrl]
      }

      setGallery(nextGallery)
      setReviewMap(nextReview)
      setPlaceholders(nextPlaceholders)
      onGalleryChange(nextGallery)
      onReviewChange?.(nextReview)
      onPlaceholdersChange?.(nextPlaceholders)

      setRenamingUrl(null)
      setNewFilename('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo renombrar la imagen.')
    } finally {
      setBusy(false)
    }
  }

  const handleOptimize = async (url: string) => {
    setBusy(true)
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

      // Update local state
      const nextGallery = gallery.map(u => (u === url ? data.newUrl : u))
      const nextReview = { ...reviewMap }
      if (nextReview[url] !== undefined) {
        nextReview[data.newUrl] = nextReview[url]
        delete nextReview[url]
      }
      const nextPlaceholders = { ...placeholders }
      if (data.placeholder) {
        nextPlaceholders[data.newUrl] = data.placeholder
      } else if (nextPlaceholders[url]) {
        nextPlaceholders[data.newUrl] = nextPlaceholders[url]
      }
      delete nextPlaceholders[url]

      setGallery(nextGallery)
      setReviewMap(nextReview)
      setPlaceholders(nextPlaceholders)
      onGalleryChange(nextGallery)
      onReviewChange?.(nextReview)
      onPlaceholdersChange?.(nextPlaceholders)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo optimizar la imagen.')
    } finally {
      setBusy(false)
    }
  }

  const [restoringUrl, setRestoringUrl] = useState<string | null>(null)
  const restoreExifInputRef = useRef<HTMLInputElement | null>(null)

  const handleRestoreExifClick = (url: string) => {
    setRestoringUrl(url)
    restoreExifInputRef.current?.click()
  }

  const [dragOverUrl, setDragOverUrl] = useState<string | null>(null)

  const processRestoreExif = async (file: File, targetUrl: string) => {
    if (!productId) return

    setBusy(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('productId', productId)
      formData.append('targetUrl', targetUrl)
      formData.append('file', file)

      const response = await fetch('/api/admin/media/restore-exif', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al restaurar EXIF')
      }

      // Show success message with metadata
      const meta = data.metadata
      const metaString = meta ?
        `EXIF Recuperado:\nDimensiones: ${meta.width}x${meta.height}\nFormato: ${meta.format}\nEXIF: ${meta.exif}` :
        'EXIF Recuperado correctamente'

      alert(metaString)

      // Force refresh of the image by updating the gallery state with a timestamp query param?
      // Or just rely on browser cache invalidation if the ETag changes?
      // R2 might cache.
      // Let's try to force a re-render of the image component by updating a "version" state if needed.
      // For now, simple alert is what was requested.

    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restaurar EXIF.')
    } finally {
      setBusy(false)
      setRestoringUrl(null)
      setDragOverUrl(null)
    }
  }

  const handleRestoreExifChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !restoringUrl) {
      setRestoringUrl(null)
      return
    }
    await processRestoreExif(file, restoringUrl)
  }

  // Simplified drag handlers - only for image thumbnails
  const handleImageDragOver = (e: React.DragEvent, url: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDisabled || busy) {
      e.dataTransfer.dropEffect = 'none'
      return
    }
    e.dataTransfer.dropEffect = 'copy'
    setDragOverUrl(url)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if the element we are entering (relatedTarget) is still inside our container (currentTarget)
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }

    setDragOverUrl(null)
  }

  const handleImageDrop = (e: React.DragEvent, url: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverUrl(null)

    if (isDisabled || busy) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      void processRestoreExif(file, url)
    }
  }

  return (
    <div
      className={`rounded-3xl border border-neutral-200 bg-white p-6 transition ${isDragging ? 'border-neutral-900 bg-neutral-50' : ''
        }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
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
      <input
        ref={restoreExifInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRestoreExifChange}
        disabled={busy}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">Galería de imágenes</h2>
          <p className="text-xs text-neutral-500">
            Las fotos se suben y optimizan automáticamente (WebP en varias resoluciones).
          </p>
          <p className="text-[11px] text-neutral-400">Arrastra imágenes aquí o usa el botón.</p>
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
          const filename = url.split('/').pop() || 'imagen'

          return (
            <div
              key={`${url}-${index}`}
              className="relative flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 transition-colors"
              onMouseEnter={() => setHoveredUrl(displayUrl)}
              onMouseLeave={() => setHoveredUrl(null)}
            >
              {/* Image thumbnail with drop zone indicator */}
              <div className="flex flex-col items-center gap-1">
                {/* Camera icon - indicates this is a drop zone */}
                {!isDisabled && (
                  <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">
                    📷 EXIF
                  </div>
                )}

                {/* DROP ZONE for EXIF restoration */}
                <div
                  className={`relative h-20 w-16 overflow-hidden rounded-xl transition-all ${dragOverUrl === url
                    ? 'ring-4 ring-blue-500 ring-offset-2 scale-105'
                    : 'bg-white'
                    }`}
                  onDragOver={(e) => handleImageDragOver(e, url)}
                  onDragLeave={handleImageDragLeave}
                  onDrop={(e) => handleImageDrop(e, url)}
                  title="Arrastra aquí la foto original para restaurar EXIF"
                >
                  {dragOverUrl === url && (
                    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-blue-500/90">
                      <p className="text-[8px] font-bold text-white text-center px-1">SOLTAR AQUÍ</p>
                    </div>
                  )}
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
              </div>
              <div className="flex-1 min-w-0">
                <div className="break-all text-xs text-neutral-600 font-medium">{filename}</div>
                <div className="break-all text-[10px] text-neutral-400 mt-0.5">{url}</div>
              </div>
              {!isDisabled && (
                <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetFeatured(index)}
                      className="flex-1 rounded-full border border-neutral-300 px-3 py-1 hover:border-neutral-900 hover:text-neutral-900"
                    >
                      Destacar
                    </button>
                    <button
                      type="button"
                      onClick={() => openRenameModal(url)}
                      className="flex-1 rounded-full border border-neutral-300 px-3 py-1 hover:border-neutral-900 hover:text-neutral-900"
                    >
                      Renombrar
                    </button>
                  </div>
                  {!url.toLowerCase().endsWith('.webp') && (
                    <button
                      type="button"
                      onClick={() => handleOptimize(url)}
                      disabled={busy}
                      className="w-full rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 hover:border-amber-500 hover:text-amber-900 disabled:opacity-50"
                    >
                      {busy ? 'Convirtiendo...' : '⚡ Optimizar a WebP'}
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTaggingUrl(url)}
                      className="flex-1 rounded-full border border-neutral-300 px-3 py-1 hover:border-neutral-900 hover:text-neutral-900"
                    >
                      Etiquetar
                    </button>
                    <button
                      type="button"
                      onClick={() => openMoveModal(url)}
                      className="flex-1 rounded-full border border-neutral-300 px-3 py-1 hover:border-neutral-900 hover:text-neutral-900"
                    >
                      Mover
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex-1 rounded-full border border-neutral-300 px-3 py-1 text-center hover:border-neutral-900 hover:text-neutral-900"
                    >
                      Descargar
                    </a>
                    <button
                      type="button"
                      onClick={() => handleToggleReview(url)}
                      className={`flex-1 rounded-full border px-3 py-1 ${reviewMap[url]
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                        }`}
                    >
                      {reviewMap[url] ? 'Revisado' : 'Revisar'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreExifClick(url)}
                    className="w-full rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 hover:border-blue-500 hover:text-blue-900"
                    title="Subir original para restaurar EXIF"
                  >
                    📷 Restaurar EXIF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(url)}
                    className="w-full rounded-full border border-red-200 px-3 py-1 text-red-500 hover:border-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hover Preview */}
      {hoveredUrl && (
        <div className="pointer-events-none fixed right-[620px] top-1/2 z-50 -translate-y-1/2 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl">
          <div className="relative h-[500px] w-[400px]">
            <Image
              src={hoveredUrl}
              alt="Vista previa"
              fill
              className="object-cover"
              sizes="400px"
              priority
            />
          </div>
        </div>
      )}

      {/* Preload Images for Hover Zoom */}
      <div className="hidden">
        {gallery.map((url) => (
          <Image
            key={`preload-${url}`}
            src={getProductImageVariant(url, 'original') || url}
            alt="preload"
            width={400}
            height={500}
            sizes="400px"
            priority
          />
        ))}
      </div>

      {/* Move Modal */}
      {movingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">Mover imagen</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Selecciona el producto al que quieres mover esta imagen.
            </p>

            <div className="mt-4">
              {loadingProducts ? (
                <p className="text-sm text-neutral-500">Cargando productos...</p>
              ) : (
                <select
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
                  value={targetProductId}
                  onChange={e => setTargetProductId(e.target.value)}
                >
                  <option value="">Selecciona un producto...</option>
                  {availableProducts
                    .filter(p => p.id !== productId) // Exclude current product
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setMovingUrl(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleMoveSubmit}
                disabled={!targetProductId || busy}
                className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? 'Moviendo...' : 'Mover imagen'}
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
                onClick={() => setRenamingUrl(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={!newFilename.trim() || busy}
                className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? 'Renombrando...' : 'Renombrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {taggingUrl && (
        <ImageTaggingModal
          url={taggingUrl}
          onClose={() => setTaggingUrl(null)}
        />
      )}
    </div>
  )
}
