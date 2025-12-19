'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ProductImage } from '@/components/common/ProductImage'
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
import { ColorSelectionModal, SelectedColors } from '@/components/product/ColorSelectionModal'
import { Palette } from 'lucide-react'
import { YARN_COLORS } from '@/lib/colors/constants'

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

const DEFAULT_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']

const ProductAdminPanel = dynamic(() => import('./ProductAdminPanel'), {
  ssr: false,
  loading: () => null
})

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
  const { data: session } = useSession()

  const initialGallery = useMemo(() => {
    return product.gallery.length > 0 ? product.gallery : product.image ? [product.image] : []
  }, [product.gallery, product.image])
  const initialPlaceholders = useMemo(
    () => extractProductPlaceholderMap(product.metadata),
    [product.metadata]
  )
  const initialReviewMap = useMemo(() => {
    const meta = product.metadata
    if (meta && typeof meta.imageReview === 'object') {
      return meta.imageReview as Record<string, boolean>
    }
    return {}
  }, [product.metadata])
  const [gallery, setGallery] = useState(initialGallery)
  const [placeholderMap, setPlaceholderMap] = useState(initialPlaceholders)
  const [reviewMap, setReviewMap] = useState<Record<string, boolean>>(initialReviewMap)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const sizeOptions = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0])
  const story = useMemo(() => extractProductStory(product), [product])
  const [localSuggestions, setLocalSuggestions] = useState<SuggestedProduct[]>([])
  const [displayPrice, setDisplayPrice] = useState(product.price.toFixed(2))
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [gallerySaving, setGallerySaving] = useState(false)
  const [adminPreviewMode, setAdminPreviewMode] = useState(false)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const addInputRef = useRef<HTMLInputElement | null>(null)
  const pendingReplaceIndex = useRef<number | null>(null)
  const heroSwipeStateRef = useRef<{ startX: number; startY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    active: false
  })

  const [colorModalOpen, setColorModalOpen] = useState(false)
  const [selectedColors, setSelectedColors] = useState<SelectedColors>({
    base: null,
    drawing: null,
    detail: null,
    variation: null
  })

  useEffect(() => {
    setGallery(initialGallery)
    setActiveIndex(0)
  }, [initialGallery])

  useEffect(() => {
    setDisplayPrice(product.price.toFixed(2))
  }, [product.price])

  useEffect(() => {
    setPlaceholderMap(initialPlaceholders)
  }, [initialPlaceholders])

  useEffect(() => {
    setReviewMap(initialReviewMap)
  }, [initialReviewMap])

  // Preload all gallery images for instant navigation
  useEffect(() => {
    if (gallery.length <= 1) return

    // Preload all images in the background
    gallery.forEach((imagePath, index) => {
      if (index === activeIndex) return // Skip active image (already loaded)

      const img = new window.Image()
      const fullUrl = getProductImageVariant(imagePath, 'full') || imagePath
      img.src = fullUrl
    })
  }, [gallery, activeIndex])


  const adminModeEnabled = (isAdmin || session?.user?.role === 'admin') && !adminPreviewMode

  const whatsappHref = useMemo(() => {
    const colorDetails = [
      selectedColors.base ? `Base: #${selectedColors.base.id}` : null,
      selectedColors.drawing ? `Dibujo: #${selectedColors.drawing.id}` : null,
      selectedColors.detail ? `Detalle: #${selectedColors.detail.id}` : null,
      selectedColors.variation ? `Var. Detalle: #${selectedColors.variation.id}` : null
    ].filter(Boolean).join(', ')

    const details = [
      `Hola, me interesa el diseño ${product.name}`,
      product.category ? `Colección: ${product.category}` : null,
      selectedSize ? `Talla: ${selectedSize}` : null,
      colorDetails ? `Colores: ${colorDetails}` : null
    ]
      .filter(Boolean)
      .join(' · ')

    return `${WHATSAPP_LINK}?text=${encodeURIComponent(details)}`
  }, [product.category, product.name, selectedSize, selectedColors])

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
    additions: Record<string, string> = {},
    nextReview: Record<string, boolean> = reviewMap
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
          placeholders: nextPlaceholders,
          reviewed: nextReview
        })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudo sincronizar la galería.')
      }
      setGallery(nextGallery)
      setPlaceholderMap(nextPlaceholders)
      setReviewMap(nextReview)
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
    const nextReview = { ...reviewMap }
    const removed = gallery[index]
    if (removed) {
      delete nextReview[removed]
    }
    await syncGallery(nextGallery, {}, nextReview)
  }

  const handleFeatureImage = async (index: number) => {
    if (index === 0 || index >= gallery.length) {
      return
    }
    const nextGallery = [...gallery]
    const [entry] = nextGallery.splice(index, 1)
    nextGallery.unshift(entry)
    const nextReview: Record<string, boolean> = {}
    nextGallery.forEach(url => {
      nextReview[url] = reviewMap[url] ?? false
    })
    try {
      await syncGallery(nextGallery, {}, nextReview)
      setActiveIndex(0)
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'No se pudo destacar la imagen.')
    }
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
      const nextReview = { ...reviewMap, [result.path]: false }
      await syncGallery(nextGallery, { [result.path]: result.placeholder }, nextReview)
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
      const nextReview = { ...reviewMap, [result.path]: false }
      await syncGallery([...gallery, result.path], { [result.path]: result.placeholder }, nextReview)
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
    }
  }

  const openReplacePicker = (index: number) => {
    pendingReplaceIndex.current = index
    replaceInputRef.current?.click()
  }

  const handleGoToPrev = () => {
    if (gallery.length === 0) return
    setActiveIndex(index => (index - 1 + gallery.length) % gallery.length)
  }

  const handleGoToNext = () => {
    if (gallery.length === 0) return
    setActiveIndex(index => (index + 1) % gallery.length)
  }

  const handleToggleReview = async (url: string) => {
    const nextReview = { ...reviewMap, [url]: !reviewMap[url] }
    try {
      await syncGallery(gallery, {}, nextReview)
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'No se pudo actualizar la galería.')
    }
  }

  const handleDownloadImage = async (url: string) => {
    try {
      const proxyUrl = `/api/media-proxy?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error('No se pudo descargar la imagen.')
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = url.split('/').pop() || 'imagen'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : 'No se pudo descargar la imagen.')
    }
  }

  const handleHeroTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    heroSwipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      active: true
    }
  }

  const handleHeroTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!heroSwipeStateRef.current.active) return
    const touch = event.touches[0]
    const deltaX = touch.clientX - heroSwipeStateRef.current.startX
    const deltaY = Math.abs(touch.clientY - heroSwipeStateRef.current.startY)
    if (deltaY > 70) {
      heroSwipeStateRef.current.active = false
      return
    }
    if (deltaX > 80) {
      heroSwipeStateRef.current.active = false
      handleGoToPrev()
    } else if (deltaX < -80) {
      heroSwipeStateRef.current.active = false
      handleGoToNext()
    }
  }

  const handleHeroTouchEnd = () => {
    heroSwipeStateRef.current.active = false
  }

  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-6">
              <div
                className="relative aspect-[3/4] overflow-hidden bg-white"
                onTouchStart={handleHeroTouchStart}
                onTouchMove={handleHeroTouchMove}
                onTouchEnd={handleHeroTouchEnd}
              >
                {adminModeEnabled && (
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
                  <ProductImage
                    imagePath={activeImage}
                    variant="full"
                    alt={`${product.name} · ${product.category ?? 'calcetines artesanales'} · vista ${activeIndex + 1}`}
                    fill
                    priority
                    fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
                    className="object-contain"
                    sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 60vw, 100vw"
                    onClick={() => setLightboxOpen(true)}
                    placeholder={heroPlaceholder ? 'blur' : 'empty'}
                    blurDataURL={heroPlaceholder}
                  />
                )}

                {/* Color Swatches Overlay */}
                {(() => {
                  const currentAsset = product.mediaAssets?.find(a => a.url === activeImage)
                  if (!currentAsset?.tags) return null

                  const colorTags = currentAsset.tags
                    .filter(t => t.toLowerCase().startsWith('color '))
                    .map(t => {
                      const id = parseInt(t.split(' ')[1])
                      return YARN_COLORS.find(c => c.id === id)
                    })
                    .filter(Boolean)

                  if (colorTags.length === 0) return null

                  return (
                    <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-none">
                      {colorTags.map(color => color && (
                        <div
                          key={color.id}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-lg relative group pointer-events-auto overflow-visible bg-gray-100 transition-transform duration-300 hover:scale-[3] hover:z-50 origin-bottom"
                        >
                          <Image
                            src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev'}/images/colors/color-${color.id}.png`}
                            alt={`Color ${color.id}`}
                            fill
                            className="object-cover rounded-full"
                            sizes="120px"
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/90 text-white text-[5px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none shadow-sm">
                            #{color.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                {gallery.length > 1 && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                    <button
                      type="button"
                      className="pointer-events-auto rounded-full bg-white/80 px-2 py-1 text-xs uppercase tracking-[0.2em] text-neutral-600 shadow hover:bg-white"
                      onClick={handleGoToPrev}
                      aria-label="Ver imagen anterior"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="pointer-events-auto rounded-full bg-white/80 px-2 py-1 text-xs uppercase tracking-[0.2em] text-neutral-600 shadow hover:bg-white"
                      onClick={handleGoToNext}
                      aria-label="Ver imagen siguiente"
                    >
                      →
                    </button>
                  </div>
                )}
                {adminModeEnabled && (
                  <div className="pointer-events-none absolute inset-0 flex items-start justify-between gap-2 p-3">
                    <div className="pointer-events-auto flex flex-col gap-2">
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${reviewMap[activeImage]
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-white/60 bg-black/40 text-white'
                          }`}
                        onClick={() => handleToggleReview(activeImage)}
                        disabled={gallerySaving}
                      >
                        {reviewMap[activeImage] ? 'Revisado' : 'Marcar revisado'}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/60 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white"
                        onClick={() =>
                          handleDownloadImage(getProductImageVariant(activeImage, 'original') || activeImage)
                        }
                        disabled={gallerySaving}
                      >
                        Descargar
                      </button>
                    </div>
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
                        onClick={() => handleFeatureImage(activeIndex)}
                        disabled={gallerySaving || activeIndex === 0}
                      >
                        Destacar
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
                        className={`relative h-24 w-20 overflow-hidden border ${activeIndex === index ? 'border-neutral-900' : 'border-neutral-200'
                          }`}
                      >
                        <ProductImage
                          imagePath={photo}
                          variant="thumb"
                          alt={`Miniatura ${index + 1} · ${product.name} · ${product.color || 'color artesanal'}`}
                          fill
                          className="object-contain"
                          sizes="80px"
                          placeholder={thumbPlaceholder ? 'blur' : 'empty'}
                          blurDataURL={thumbPlaceholder}
                          loading="eager"
                          fetchPriority={index < 3 ? 'high' : 'auto'}
                        />
                        {adminModeEnabled && (
                          <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-1">
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label="Reemplazar imagen"
                              className={`pointer-events-auto rounded-full bg-black/60 px-2 text-[11px] text-white ${!uploadsEnabled || gallerySaving ? 'opacity-40' : ''
                                }`}
                              onClick={event => {
                                if (!uploadsEnabled || gallerySaving) return
                                event.preventDefault()
                                event.stopPropagation()
                                openReplacePicker(index)
                              }}
                              onKeyDown={event => {
                                if (!uploadsEnabled || gallerySaving) return
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  openReplacePicker(index)
                                }
                              }}
                            >
                              ✎
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {gallery.length > 1 && (
                <p className="text-xs text-neutral-500">
                  Consejo: puedes usar las flechas ← → para cambiar de foto sin abrir el modo ampliado.
                </p>
              )}
              {adminModeEnabled && !uploadsEnabled && (
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setAdminPreviewMode(mode => !mode)}
                    className="w-full rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                  >
                    {adminPreviewMode ? 'Volver a modo gestión' : 'Ver como visitante'}
                  </button>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-semibold text-neutral-900">{Number(displayPrice).toFixed(2)} €</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">+ gastos de envío</p>
                  </div>
                </div>
                {adminModeEnabled && (
                  <ProductAdminPanel
                    product={product}
                    activeImage={activeImage}
                    onPriceDisplayChange={setDisplayPrice}
                    onImageTagsChange={(url, newTags) => {
                      // Update the local product state to reflect tag changes immediately
                      if (product.mediaAssets) {
                        const assetIndex = product.mediaAssets.findIndex(a => a.url === url)
                        if (assetIndex !== -1) {
                          product.mediaAssets[assetIndex].tags = newTags
                        }
                      }
                    }}
                  />
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Colores Personalizados
                    </label>
                    <button
                      type="button"
                      onClick={() => setColorModalOpen(true)}
                      className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <Palette size={14} />
                      Elegir Colores
                    </button>
                  </div>

                  {(selectedColors.base || selectedColors.drawing || selectedColors.detail) ? (
                    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {[
                        { label: 'Base', color: selectedColors.base },
                        { label: 'Dibujo', color: selectedColors.drawing },
                        { label: 'Detalle', color: selectedColors.detail },
                        { label: 'Var.', color: selectedColors.variation }
                      ].map((item) => item.color && (
                        <div key={item.label} className="flex flex-col items-center gap-2">
                          <div className="relative w-12 h-12 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-100">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/images/colors/color-${item.color.id}.png`}
                              alt={`Color ${item.color.id}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                              {item.label}
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              #{item.color.id}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setColorModalOpen(true)}
                      className="w-full py-4 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group"
                    >
                      <Palette size={18} className="text-white/80 group-hover:text-white transition-colors" />
                      Personalizar Colores
                    </button>
                  )}
                </div>

                <ColorSelectionModal
                  isOpen={colorModalOpen}
                  onClose={() => setColorModalOpen(false)}
                  onSelect={setSelectedColors}
                  allow4Colors={!!product.metadata?.allow4Colors}
                  initialColors={selectedColors}
                />
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
                      <ProductImage
                        imagePath={url}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            Cerrar
          </button>
          <div className="relative aspect-[3/4] w-full max-w-3xl bg-black">
            <button
              type="button"
              onClick={() => setActiveIndex(index => (index - 1 + gallery.length) % gallery.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-2xl text-white transition hover:bg-black/90"
              aria-label="Ver imagen anterior"
            >
              ←
            </button>
            <ProductImage
              imagePath={activeImage}
              variant="full"
              alt={`${product.name} ampliada ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 90vw"
              fetchPriority="high"
              placeholder={heroPlaceholder ? 'blur' : 'empty'}
              blurDataURL={heroPlaceholder}
            />
            <button
              type="button"
              onClick={() => setActiveIndex(index => (index + 1) % gallery.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-2xl text-white transition hover:bg-black/90"
              aria-label="Ver imagen siguiente"
            >
              →
            </button>
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
                        <ProductImage
                          imagePath={item.image}
                          variant="thumb"
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
                      <p className="text-sm text-neutral-600">
                        {item.price.toFixed(2)} €
                        <span className="ml-1 text-xs uppercase tracking-[0.2em] text-neutral-500">+ gastos de envío</span>
                      </p>
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
                        <ProductImage
                          imagePath={item.image}
                          variant="thumb"
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
                      <p className="text-sm text-neutral-600">
                        {item.price.toFixed(2)} €
                        <span className="ml-1 text-xs uppercase tracking-[0.2em] text-neutral-500">+ gastos de envío</span>
                      </p>
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
