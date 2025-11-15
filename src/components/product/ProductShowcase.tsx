'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/products'
import { getLocalCoViewGraph, registerProductView, trackEvent } from '@/lib/analytics'
import {
  buildProductPlaceholderMap,
  extractProductPlaceholderMap,
  getImagePlaceholder,
  getProductImageVariant
} from '@/lib/images'
import { WHATSAPP_LINK } from '@/lib/contact'
import { uploadProductImage } from '@/lib/client/uploadProductImage'

interface SuggestedProduct {
  id: string
  name: string
  image: string
  price: number
  category?: string
  viewCount?: number
  placeholder?: string
}

interface ProductShowcaseProps {
  product: Product
  recommendations?: SuggestedProduct[]
  isAdmin?: boolean
  showLocalSuggestions?: boolean
}

const DEFAULT_SIZES = ['35-36', '37-38', '39-40', '41-42']

type ProductStory = {
  title: string
  body: string
  origin?: string
  cost?: string
  images: string[]
}

const extractProductStory = (product: Product): ProductStory | null => {
  const metadata = product.metadata ?? {}
  const title = typeof metadata.storyTitle === 'string' ? metadata.storyTitle.trim() : ''
  const body = typeof metadata.storyBody === 'string' ? metadata.storyBody.trim() : ''
  const origin = typeof metadata.storyOrigin === 'string' ? metadata.storyOrigin.trim() : ''
  const cost = typeof metadata.storyCost === 'string' ? metadata.storyCost.trim() : ''
  const imagesRaw = metadata.storyImages
  let images: string[] = []
  if (Array.isArray(imagesRaw)) {
    images = imagesRaw.map(value => String(value ?? '').trim()).filter(Boolean)
  } else if (typeof imagesRaw === 'string') {
    images = imagesRaw
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  }

  if (!title && !body && !origin && !cost && images.length === 0) {
    return null
  }

  return {
    title: title || product.name,
    body,
    origin,
    cost,
    images
  }
}

export function ProductShowcase({
  product,
  recommendations = [],
  isAdmin = false,
  showLocalSuggestions = true
}: ProductShowcaseProps) {
  const initialGallery = useMemo(() => {
    return product.gallery.length > 0 ? product.gallery : product.image ? [product.image] : []
  }, [product.gallery, product.image])
  const initialPlaceholders = useMemo(
    () => extractProductPlaceholderMap(product.metadata),
    [product.metadata]
  )
  const [gallery, setGallery] = useState(initialGallery)
  const [placeholderMap, setPlaceholderMap] = useState(initialPlaceholders)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const sizeOptions = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0])
  const story = useMemo(() => extractProductStory(product), [product])
  const [localSuggestions, setLocalSuggestions] = useState<SuggestedProduct[]>([])
  const [priceInput, setPriceInput] = useState(product.price.toFixed(2))
  const [priceStatus, setPriceStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [gallerySaving, setGallerySaving] = useState(false)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const addInputRef = useRef<HTMLInputElement | null>(null)
  const pendingReplaceIndex = useRef<number | null>(null)

  useEffect(() => {
    setGallery(initialGallery)
    setActiveIndex(0)
  }, [initialGallery])

  useEffect(() => {
    setPlaceholderMap(initialPlaceholders)
  }, [initialPlaceholders])

  const whatsappHref = useMemo(() => {
    const details = [
      `Hola, me interesa el diseño ${product.name}`,
      product.category ? `Colección: ${product.category}` : null,
      selectedSize ? `Talla: ${selectedSize}` : null
    ]
      .filter(Boolean)
      .join(' · ')

    return `${WHATSAPP_LINK}?text=${encodeURIComponent(details)}`
  }, [product.category, product.name, selectedSize])

  useEffect(() => {
    registerProductView(product.id)
  }, [product.id])

  useEffect(() => {
    let cancelled = false
    const graph = getLocalCoViewGraph()
    const neighbors = graph[product.id]
    if (!neighbors) {
      setLocalSuggestions([])
      return
    }

    const loadSuggestions = async () => {
      const entries = Object.entries(neighbors).sort((a, b) => b[1] - a[1])
      const items: SuggestedProduct[] = []
      for (const [neighborId] of entries) {
        if (items.length >= 4) break
        const existing = recommendations.find(rec => rec.id === neighborId)
        if (existing) {
          items.push(existing)
          continue
        }
        try {
          const response = await fetch(`/api/products/${neighborId}`)
          if (!response.ok) continue
          const data = await response.json()
          const remotePlaceholders = extractProductPlaceholderMap(data.metadata)
          items.push({
            id: data.id,
            name: data.name,
            image: data.image,
            price: data.price,
            category: data.category,
            viewCount: data.viewCount,
            placeholder: remotePlaceholders[data.image as string]
          })
        } catch {
          continue
        }
      }
      if (!cancelled) {
        setLocalSuggestions(items)
      }
    }

    loadSuggestions()
    return () => {
      cancelled = true
    }
  }, [product.id, recommendations])

  useEffect(() => {
    if (!lightboxOpen) {
      return
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false)
      } else if (event.key === 'ArrowRight') {
        setActiveIndex(index => (index + 1) % gallery.length)
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex(index => (index - 1 + gallery.length) % gallery.length)
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [lightboxOpen, gallery.length])

  const uploadsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_MEDIA_UPLOADS !== 'false' &&
    Boolean(process.env.NEXT_PUBLIC_R2_PUBLIC_URL)
  const activeImage = gallery[activeIndex] ?? ''
  const heroPlaceholder = getImagePlaceholder(placeholderMap, activeImage)

  const syncGallery = async (
    nextGallery: string[],
    additions: Record<string, string> = {}
  ) => {
    setGallerySaving(true)
    setGalleryError(null)
    try {
      const nextPlaceholders = buildProductPlaceholderMap(nextGallery, placeholderMap, additions)
      const response = await fetch(`/api/products/${product.id}/media`, {
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
      setPlaceholderMap(nextPlaceholders)
      if (nextGallery.length === 0) {
        setActiveIndex(0)
      } else if (activeIndex >= nextGallery.length) {
        setActiveIndex(nextGallery.length - 1)
      }
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'Error al actualizar la galería.')
    } finally {
      setGallerySaving(false)
    }
  }

  const handleRemoveImage = async (index: number) => {
    const nextGallery = gallery.filter((_, idx) => idx !== index)
    await syncGallery(nextGallery)
  }

  const handleReplaceFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const targetIndex = pendingReplaceIndex.current
    pendingReplaceIndex.current = null
    if (!file || targetIndex === null) return
    try {
      const result = await uploadProductImage(product.id, file)
      const nextGallery = [...gallery]
      nextGallery[targetIndex] = result.path
      await syncGallery(nextGallery, { [result.path]: result.placeholder })
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'No se pudo reemplazar la imagen.')
    }
  }

  const handleAddFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const result = await uploadProductImage(product.id, file)
      await syncGallery([...gallery, result.path], { [result.path]: result.placeholder })
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
    }
  }

  const openReplacePicker = (index: number) => {
    pendingReplaceIndex.current = index
    replaceInputRef.current?.click()
  }

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
      setPriceInput(parsed.toFixed(2))
      setPriceStatus('success')
    } catch (error) {
      console.error(error)
      setPriceStatus('error')
    } finally {
      setTimeout(() => setPriceStatus('idle'), 2000)
    }
  }

  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-6">
              <div className="relative aspect-[3/4] overflow-hidden bg-white">
                {isAdmin && (
                  <>
                    <input
                      ref={replaceInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleReplaceFile}
                    />
                    <input
                      ref={addInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddFile}
                    />
                  </>
                )}
                {gallery.length > 0 && (
                  <Image
                    src={getProductImageVariant(activeImage, 'full')}
                    alt={`${product.name} · ${product.category ?? 'calcetines artesanales'} · vista ${activeIndex + 1}`}
                    fill
                    priority
                    className="object-contain"
                    sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 60vw, 100vw"
                    onClick={() => setLightboxOpen(true)}
                    placeholder={heroPlaceholder ? 'blur' : 'empty'}
                    blurDataURL={heroPlaceholder}
                  />
                )}
                {isAdmin && (
                  <div className="pointer-events-none absolute inset-0 flex items-start justify-end gap-2 p-3">
                    <div className="pointer-events-auto flex flex-col gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/60 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white"
                        onClick={() => openReplacePicker(activeIndex)}
                        disabled={!uploadsEnabled || gallerySaving}
                      >
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/60 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white"
                        onClick={() => handleRemoveImage(activeIndex)}
                        disabled={gallerySaving}
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/60 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white"
                        onClick={() => addInputRef.current?.click()}
                        disabled={!uploadsEnabled || gallerySaving}
                      >
                        Añadir foto
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {gallery.map((photo, index) => {
                    const thumbPlaceholder = getImagePlaceholder(placeholderMap, photo)
                    return (
                      <button
                        key={photo}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`relative h-24 w-20 overflow-hidden border ${
                          activeIndex === index ? 'border-neutral-900' : 'border-neutral-200'
                        }`}
                      >
                        <Image
                          src={getProductImageVariant(photo, 'thumb')}
                          alt={`Miniatura ${index + 1} · ${product.name} · ${product.color || 'color artesanal'}`}
                          fill
                          className="object-contain"
                          sizes="80px"
                          placeholder={thumbPlaceholder ? 'blur' : 'empty'}
                          blurDataURL={thumbPlaceholder}
                        />
                        {isAdmin && (
                          <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-1">
                            <button
                              type="button"
                              className="pointer-events-auto rounded-full bg-black/60 px-2 text-[11px] text-white"
                              onClick={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                openReplacePicker(index)
                              }}
                              disabled={!uploadsEnabled || gallerySaving}
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {isAdmin && !uploadsEnabled && (
                <p className="text-xs text-red-500">
                  Configura las credenciales privadas de R2 (R2_ACCESS_KEY_ID/SECRET, R2_ENDPOINT, R2_BUCKET_NAME)
                  y NEXT_PUBLIC_R2_PUBLIC_URL para habilitar la edición directa de la galería.
                </p>
              )}
              {galleryError && (
                <p className="text-xs text-red-500">{galleryError}</p>
              )}
            </div>

            <div className="flex flex-col gap-8">
              <div className="space-y-3">
                <nav className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  <Link href="/">Catálogo</Link>
                  {product.category && (
                    <>
                      <span className="mx-2 text-neutral-300">/</span>
                      <span>{product.category}</span>
                    </>
                  )}
                </nav>
                <h1 className="text-3xl font-semibold text-neutral-900">{product.name}</h1>
                <p className="text-sm leading-relaxed text-neutral-600">{product.description}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-semibold text-neutral-900">{Number(priceInput).toFixed(2)} €</p>
                  {isAdmin && (
                    <button
                      type="button"
                      className="text-xs uppercase tracking-[0.3em] text-neutral-500 underline"
                      onClick={() => setPriceInput(product.price.toFixed(2))}
                    >
                      Reset
                    </button>
                  )}
                </div>
                {isAdmin && (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
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
                    </div>
                    {priceStatus === 'error' && (
                      <p className="mt-2 text-xs text-red-500">Introduce un valor válido.</p>
                    )}
                    {priceStatus === 'success' && (
                      <p className="mt-2 text-xs text-emerald-600">Precio actualizado.</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="size" className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Talla
                  </label>
                  <select
                    id="size"
                    value={selectedSize}
                    onChange={event => setSelectedSize(event.target.value)}
                    className="w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
                  >
                    {sizeOptions.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-center"
                    onClick={() => trackEvent('whatsapp_cta', { productId: product.id })}
                  >
                    Reservar vía WhatsApp
                  </a>
                  <Link href="/" className="btn-secondary text-center">
                    Volver al catálogo
                  </Link>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
                <p>
                  Elaboración artesanal en talleres valencianos. Cada par se documenta en fotografía de
                  estudio para mostrar con precisión la textura y la caída del tejido.
                </p>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-neutral-500">Color</dt>
                    <dd className="mt-1 text-neutral-800">{product.color}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-neutral-500">Material</dt>
                    <dd className="mt-1 text-neutral-800">{product.material}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-neutral-500">Origen</dt>
                    <dd className="mt-1 text-neutral-800">{product.origin}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-neutral-500">Cuidado</dt>
                    <dd className="mt-1 text-neutral-800">{product.care}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
                {product.content
                  .split('\n')
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {story && (
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Historia</p>
                <h3 className="text-2xl font-semibold text-neutral-900">{story.title}</h3>
                {(story.origin || story.cost) && (
                  <dl className="grid gap-4 sm:grid-cols-2 text-sm text-neutral-600">
                    {story.origin && (
                      <div>
                        <dt className="text-xs uppercase tracking-[0.3em] text-neutral-500">Procedencia</dt>
                        <dd className="mt-1 text-neutral-800">{story.origin}</dd>
                      </div>
                    )}
                    {story.cost && (
                      <div>
                        <dt className="text-xs uppercase tracking-[0.3em] text-neutral-500">Coste / dedicación</dt>
                        <dd className="mt-1 text-neutral-800">{story.cost}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {story.body && <p className="text-neutral-700">{story.body}</p>}
              </div>
              {story.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {story.images.map(url => (
                    <div
                      key={url}
                      className="relative h-32 overflow-hidden rounded-2xl border border-neutral-100 bg-white"
                    >
                      <Image
                        src={url}
                        alt={`Historia ${product.name}`}
                        fill
                        className="object-cover"
                        sizes="180px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {lightboxOpen && gallery.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-900"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex(index => (index - 1 + gallery.length) % gallery.length)}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-900"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex(index => (index + 1) % gallery.length)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-900"
          >
            Siguiente
          </button>
          <div className="relative aspect-[3/4] w-full max-w-3xl bg-white">
            <Image
              src={getProductImageVariant(activeImage, 'full')}
              alt={`${product.name} ampliada ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 90vw"
              placeholder={heroPlaceholder ? 'blur' : 'empty'}
              blurDataURL={heroPlaceholder}
            />
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Analytics</p>
                <h2 className="text-2xl font-semibold text-neutral-900">Calcetines sugeridos</h2>
                <p className="text-sm text-neutral-600">
                  Basados en etiquetas compartidas y comportamiento agregado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => trackEvent('suggestion_view_more', { productId: product.id })}
                className="text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-900"
              >
                Ver todo
              </button>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map(item => {
                const cardPlaceholder = item.placeholder
                return (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    className="group space-y-3 text-center sm:text-left"
                    onClick={() => trackEvent('suggestion_click', { source: product.id, target: item.id })}
                  >
                    <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden bg-white">
                      {item.image ? (
                        <Image
                          src={getProductImageVariant(item.image, 'thumb')}
                          alt={item.name}
                          fill
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 45vw"
                          placeholder={cardPlaceholder ? 'blur' : 'empty'}
                          blurDataURL={cardPlaceholder}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-400">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        {item.category ?? 'Archivo'}
                      </p>
                      <h3 className="text-base font-medium text-neutral-900">{item.name}</h3>
                      <p className="text-sm text-neutral-600">{item.price.toFixed(2)} €</p>
                      {typeof item.viewCount === 'number' && item.viewCount > 0 ? (
                        <p className="text-xs text-neutral-400">{item.viewCount} visitas</p>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {showLocalSuggestions && localSuggestions.length > 0 && (
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Basado en navegación</p>
                <h2 className="text-2xl font-semibold text-neutral-900">Otros clientes visitan</h2>
                <p className="text-sm text-neutral-600">Sugiere los modelos que más se consultan después de este producto.</p>
              </div>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {localSuggestions.map(item => {
                const cardPlaceholder = item.placeholder
                return (
                  <Link
                    key={`local-${item.id}`}
                    href={`/${item.id}`}
                    className="group space-y-3 text-center sm:text-left"
                  >
                    <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden bg-white">
                      {item.image ? (
                        <Image
                          src={getProductImageVariant(item.image, 'thumb')}
                          alt={item.name}
                          fill
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 45vw"
                          placeholder={cardPlaceholder ? 'blur' : 'empty'}
                          blurDataURL={cardPlaceholder}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-400">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        {item.category ?? 'Archivo'}
                      </p>
                      <h3 className="text-base font-medium text-neutral-900">{item.name}</h3>
                      <p className="text-sm text-neutral-600">{item.price.toFixed(2)} €</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
