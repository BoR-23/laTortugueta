'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/products'
import { registerProductView, trackEvent } from '@/lib/analytics'
import { getProductImageVariant } from '@/lib/images'
import { WHATSAPP_LINK } from '@/lib/contact'

interface SuggestedProduct {
  id: string
  name: string
  image: string
  price: number
  category?: string
}

interface ProductShowcaseProps {
  product: Product
  recommendations?: SuggestedProduct[]
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

export function ProductShowcase({ product, recommendations = [] }: ProductShowcaseProps) {
  const gallery = product.gallery.length > 0 ? product.gallery : product.image ? [product.image] : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const sizeOptions = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0])
  const story = useMemo(() => extractProductStory(product), [product])

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

  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-6">
              <div className="relative aspect-[3/4] overflow-hidden bg-white">
                {gallery.length > 0 && (
                  <Image
                    src={getProductImageVariant(gallery[activeIndex], 'full')}
                    alt={`${product.name} imagen ${activeIndex + 1}`}
                    fill
                    priority
                    className="object-contain"
                    sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 60vw, 100vw"
                    onClick={() => setLightboxOpen(true)}
                  />
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {gallery.map((photo, index) => (
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
                        alt={`${product.name} miniatura ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
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
                <p className="text-3xl font-semibold text-neutral-900">{product.price.toFixed(2)} €</p>
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
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
              src={getProductImageVariant(gallery[activeIndex], 'full')}
              alt={`${product.name} ampliada ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 90vw"
            />
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
              {recommendations.map(item => (
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
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
