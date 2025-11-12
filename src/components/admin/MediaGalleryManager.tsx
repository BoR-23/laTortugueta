'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabaseBrowserClient } from '@/lib/supabaseClient'

interface MediaGalleryManagerProps {
  productId: string
  initialGallery: string[]
  onGalleryChange: (gallery: string[]) => void
  disabled?: boolean
}

const bucket =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET?.trim() || 'product-images'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export function MediaGalleryManager({
  productId,
  initialGallery,
  onGalleryChange,
  disabled
}: MediaGalleryManagerProps) {
  const [gallery, setGallery] = useState(initialGallery)
  const [uploading, setUploading] = useState(false)
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

  const uploadFileToSupabase = async (file: File) => {
    if (!productId) {
      throw new Error('Selecciona un producto antes de subir imágenes.')
    }
    if (!supabaseBrowserClient) {
      throw new Error('Configura las variables de Supabase para habilitar la subida.')
    }
    const extension = file.name.split('.').pop()
    const safeName = `${Date.now()}-${slugify(file.name)}${extension ? `.${extension}` : ''}`
    const objectKey = `${productId}/${safeName}`
    const { error: uploadError } = await supabaseBrowserClient.storage
      .from(bucket)
      .upload(objectKey, file, { upsert: true })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabaseBrowserClient.storage.from(bucket).getPublicUrl(objectKey)
    if (!data?.publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen.')
    }
    return data.publicUrl
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    if (!productId) {
      setError('Selecciona un producto antes de subir im\u00e1genes.')
      return
    }

    if (!supabaseBrowserClient) {
      setError('Configura las variables de Supabase para habilitar la subida.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const newUrls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFileToSupabase(file)
        newUrls.push(url)
      }

      if (newUrls.length > 0) {
        await syncGallery([...gallery, ...newUrls])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron subir las im\u00e1genes.')
    } finally {
      event.target.value = ''
      setUploading(false)
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
    setReplacingIndex(targetIndex)
    setError(null)
    try {
      const newUrl = await uploadFileToSupabase(file)
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
    if (!productId) {
      setError('Selecciona un producto antes de reemplazar imágenes.')
      return
    }
    if (!supabaseBrowserClient) {
      setError('Configura las variables de Supabase para habilitar la subida.')
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
        {bucket && (
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            bucket: {bucket}
          </span>
        )}
      </div>

      {isDisabled ? (
        <p className="mt-4 text-sm text-neutral-500">
          Selecciona un producto para gestionar su galer\u00eda.
        </p>
      ) : !supabaseBrowserClient ? (
        <p className="mt-4 text-sm text-red-500">
          Necesitas definir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y NEXT_PUBLIC_SUPABASE_BUCKET
          para subir im\u00e1genes desde el panel.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-neutral-600">
            Sube varias fotos a la vez. Se guardan en Supabase Storage y se actualiza la ficha
            autom\u00e1ticamente.
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-3 rounded-full border border-dashed border-neutral-300 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-600 hover:border-neutral-900">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || busy}
            />
            {uploading ? 'Subiendo\u2026' : 'Subir im\u00e1genes'}
          </label>
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
        {gallery.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
          >
            <div className="relative h-20 w-16 overflow-hidden rounded-xl bg-white">
              {url ? (
                <Image src={url} alt={productId} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  Sin imagen
                </div>
              )}
              {!isDisabled && (
                <button
                  type="button"
                  onClick={() => handleOpenReplacePicker(index)}
                  disabled={busy || uploading || replacingIndex === index}
                  className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-600 shadow hover:text-neutral-900 disabled:opacity-50"
                >
                  {replacingIndex === index ? '...' : '✎'}
                </button>
              )}
            </div>
            <div className="flex-1 text-xs text-neutral-600 break-all">{url}</div>
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
        ))}
      </div>
    </div>
  )
}
