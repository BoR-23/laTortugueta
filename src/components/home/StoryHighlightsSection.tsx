'use client'

import Link from 'next/link'

import { WHATSAPP_LINK } from '@/lib/contact'
import { trackEvent } from '@/lib/analytics'

type Highlight = {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  cta?: {
    label: string
    href: string
    external?: boolean
  }
}

const HIGHLIGHTS: Highlight[] = [
  {
    id: 'archivo',
    eyebrow: 'Archivo vivo',
    title: '1.985 pares catalogados',
    description:
      'Custodiamos piezas originales desde 1930 y generamos réplicas listas para uso escénico. Todas las visitas son bajo cita privada.',
    bullets: [
      'Digitalización y fichas técnicas en la nube',
      'Muestras físicas disponibles en 48h',
      'Visitas al taller de Alcoi o sesiones remotas'
    ],
    cta: {
      label: 'Conoce el archivo',
      href: '/quienes-somos'
    }
  },
  {
    id: 'colectivos',
    eyebrow: 'Encargos colectivos',
    title: 'Producción coordinada para grupos',
    description:
      'Gestionamos tallas, colores y entregas para compañías de danza, fiestas patronales y producciones audiovisuales.',
    bullets: [
      'Bloques de 10 a 80 pares con prioridad de calendario',
      'Seguimiento semanal y fotos de control de calidad',
      'Plan de reposiciones para futuras temporadas'
    ],
    cta: {
      label: 'Pedir presupuesto',
      href: WHATSAPP_LINK,
      external: true
    }
  },
  {
    id: 'restauracion',
    eyebrow: 'Restauración y documentación',
    title: 'Réplicas certificadas para colecciones',
    description:
      'Creamos copias fieles para museos y familias, adjuntando certificados, cuidados y embalaje libre de ácido.',
    bullets: [
      'Informe de conservación y humedad',
      'Fotos antes/después para archivo',
      'Plan de almacenamiento y transporte'
    ],
    cta: {
      label: 'Ver historias en el blog',
      href: '/blog'
    }
  }
]

export function StoryHighlightsSection() {
  const handleHighlightClick = (highlightId: string, label: string) => {
    trackEvent('cta_click', {
      location: 'story_highlights',
      highlightId,
      label
    })
  }

  return (
    <section className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Por qué elegir La Tortugueta</p>
          <h2 className="text-3xl font-semibold text-neutral-900">Conservamos, producimos y documentamos</h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            Además del catálogo público, ofrecemos acompañamiento integral para equipos que necesitan rigor histórico y
            seguimiento artesanal.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map(highlight => (
            <article
              key={highlight.id}
              className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white px-5 py-6 shadow-sm"
            >
              <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-400">{highlight.eyebrow}</p>
              <h3 className="mt-2 text-xl font-semibold text-neutral-900">{highlight.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{highlight.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                {highlight.bullets.map(point => (
                  <li key={point} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {highlight.cta ? (
                highlight.cta.external ? (
                  <a
                    href={highlight.cta.href}
                    className="mt-5 inline-flex items-center justify-center rounded-full border border-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
                    onClick={() => handleHighlightClick(highlight.id, highlight.cta?.label ?? '')}
                  >
                    {highlight.cta.label}
                  </a>
                ) : (
                  <Link
                    href={highlight.cta.href}
                    className="mt-5 inline-flex items-center justify-center rounded-full border border-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
                    onClick={() => handleHighlightClick(highlight.id, highlight.cta?.label ?? '')}
                  >
                    {highlight.cta.label}
                  </Link>
                )
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
