'use client'

import React, { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import Link from 'next/link'

export interface HeroSlide {
  id: string
  image_url: string
  title: string
  subtitle: string
  cta_text: string
  cta_link: string
  priority: number
  mobile_crop?: {
    x: number
    y: number
    size: number
  }
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  mainH1?: string
}

export const HeroCarousel = ({ slides, mainH1 }: HeroCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  if (!slides || slides.length === 0) {
    return null
  }

  return (
    <div className="relative w-full bg-neutral-100">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div className="relative flex-[0_0_100%] min-w-0" key={slide.id}>
              <div className="relative h-[500px] w-full sm:h-[600px] lg:h-[700px]">
                {/* Desktop - full image */}
                <Image
                  src={slide.image_url}
                  alt={slide.title || 'Calcetines tradicionales y artesanales La Tortugueta'}
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: slide.mobile_crop
                      ? `${slide.mobile_crop.x}% center`
                      : 'center'
                  }}
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding={index === 0 ? 'sync' : 'async'}
                  sizes="(max-width: 640px) 100vw, 100vw"
                  quality={85}
                />

                {(slide.title || slide.subtitle) && <div className="absolute inset-0 bg-black/30" />}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  {/* Hidden Perfect SEO H1 */}
                  {index === 0 && mainH1 && (
                    <h1 className="sr-only">{mainH1}</h1>
                  )}

                  {slide.title && (
                    !mainH1 && index === 0 ? (
                      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl drop-shadow-lg">
                        {slide.title}
                      </h1>
                    ) : (
                      <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl drop-shadow-lg">
                        {slide.title}
                      </h2>
                    )
                  )}
                  {slide.subtitle && (
                    <p className="mb-8 text-lg font-medium sm:text-xl lg:text-2xl drop-shadow-md max-w-2xl">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.cta_text && slide.cta_link && (
                    <Link
                      href={slide.cta_link}
                      title={slide.cta_text}
                      className="rounded-full bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-transform hover:scale-105 hover:bg-neutral-100"
                    >
                      {slide.cta_text}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 sm:left-8"
            onClick={scrollPrev}
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40 sm:right-8"
            onClick={scrollNext}
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
