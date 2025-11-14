'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { R2ImageUploader, uploadFileToR2 } from './R2ImageUploader'
import { getProductImageVariant } from '@/lib/images'

interface MediaGalleryManagerProps {
  productId: string
  initialGallery: string[]
  onGalleryChange: (gallery: string[]) => void
  disabled?: boolean
}

const r2Bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME?.trim() || ''
const r2Configured =
  Boolean(process.env.NEXT_PUBLIC_R2_PUBLIC_URL) &&
  Boolean(process.env.NEXT_PUBLIC_R2_ENDPOINT) &&
  Boolean(process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID) &&
  Boolean(process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_R2_BUCKET_NAME)

export function MediaGalleryManager({
  productId,
  initialGallery,
  onGalleryChange,
  disabled
}: MediaGalleryManagerProps) {
  const [gallery, setGallery] = useState(initialGallery)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingReplaceIndex, setPendingReplaceIndex] = useState<number | null>(null)
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setGallery(initialGallery)
  }, [initialGallery])

  const syncGallery = async (nextGallery: string[]) => {
    setBusy(true)
    try {
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: nextGallery.map((url, index) => ({ url, position: index }))
        })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudo sincronizar la galer\u00eda.')
      }
      setGallery(nextGallery)
      onGalleryChange(nextGallery)
      setError(null)
    } finally {
      setBusy(false)
    }
  }

  const ensureUploadReady = () => {
    if (!productId) {
      setError('Selecciona un producto antes de subir imágenes.')
      return false
    }
    if (!r2Configured) {
      setError('Configura las variables de Cloudflare R2 para habilitar la subida.')
      return false
    }
    return true
  }

  const handleUploadComplete = async (url: string) => {
    if (!ensureUploadReady()) {
      return
    }
    try {
      await syncGallery([...gallery, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron subir las imágenes.')
    }
  }

  const handleReplaceFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const targetIndex = pendingReplaceIndex
    setPendingReplaceIndex(null)
    if (targetIndex === null || !file) {
      return
    }
    if (!ensureUploadReady()) {
      return
    }
    setReplacingIndex(targetIndex)
    setError(null)
    try {
      const newUrl = await uploadFileToR2(file, productId)
      const nextGallery = [...gallery]
      nextGallery[targetIndex] = newUrl
      await syncGallery(nextGallery)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reemplazar la imagen.')
    } finally {
      setReplacingIndex(null)
    }
  }

  const handleOpenReplacePicker = (index: number) => {
    if (!ensureUploadReady()) {
      return
    }
    setPendingReplaceIndex(index)
    replaceInputRef.current?.click()
  }

  const handleRemove = async (url: string) => {
    const nextGallery = gallery.filter(item => item !== url)
    try {
      await syncGallery(nextGallery)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galer\u00eda.')
    }
  }

  const handleSetFeatured = async (index: number) => {
    if (index === 0) {
      return
    }
    const nextGallery = [...gallery]
    const [entry] = nextGallery.splice(index, 1)
    nextGallery.unshift(entry)
    try {
      await syncGallery(nextGallery)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la galería.')
    }
  }

  const isDisabled = disabled || !productId

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFile}
        disabled={busy}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Galer\u00eda de im\u00e1genes
        </h2>
        {r2Bucket && (
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            bucket: {r2Bucket}
          </span>
        )}
      </div>

      {isDisabled ? (
        <p className="mt-4 text-sm text-neutral-500">
          Selecciona un producto para gestionar su galer\u00eda.
        </p>
      ) : !r2Configured ? (
        <p className="mt-4 text-sm text-red-500">
          Necesitas definir las variables NEXT_PUBLIC_R2_PUBLIC_URL, NEXT_PUBLIC_R2_ENDPOINT, NEXT_PUBLIC_R2_ACCESS_KEY_ID,
          NEXT_PUBLIC_R2_SECRET_ACCESS_KEY y NEXT_PUBLIC_R2_BUCKET_NAME para subir im\u00e1genes desde el panel.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-neutral-600">
            Sube fotos directamente a Cloudflare R2. Una vez completado el upload se actualizar\u00e1 la galer\u00eda del producto.
          </p>
          <div className="mt-4">
            <R2ImageUploader productId={productId} onUploadComplete={handleUploadComplete} />
          </div>
        </>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {gallery.length === 0 && !isDisabled && (
          <p className="text-sm text-neutral-500">Todav\u00eda no hay fotos asociadas.</p>
        )}
        {gallery.map((url, index) => {
          const displayUrl = getProductImageVariant(url, 'original') || url
          return (
            <div
              key={`${url}-${index}`}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
            >
              <div className="relative h-20 w-16 overflow-hidden rounded-xl bg-white">
                {url ? (
                  <Image src={displayUrl} alt={productId} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    Sin imagen
                  </div>
                )}
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => handleOpenReplacePicker(index)}
                    disabled={busy || replacingIndex === index}
                    className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-600 shadow hover:text-neutral-900 disabled:opacity-50"
                  >
                    {replacingIndex === index ? '...' : '✎'}
                  </button>
                )}
              </div>
              <div className="flex-1 break-all text-xs text-neutral-600">{url}</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
                  onClick={() => handleSetFeatured(index)}
                  disabled={busy || index === 0}
                >
                  Destacar
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
                  onClick={() => handleRemove(url)}
                  disabled={busy}
                >
                  Quitar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
