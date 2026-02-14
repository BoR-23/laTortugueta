'use client'

import Link from 'next/link'

import { WHATSAPP_LINK } from '@/lib/contact'
import { trackEvent } from '@/lib/analytics'
import { dictionaries } from '@/i18n/dictionaries'

interface StoryHighlightsSectionProps {
  dictionary: typeof dictionaries['es']['home']['storyHighlights']
}

type HighlightConfig = {
  id: 'archivo' | 'colectivos' | 'restauracion'
  href: string
  external?: boolean
}

const HIGHLIGHT_CONFIG: HighlightConfig[] = [
  { id: 'archivo', href: '/quienes-somos', external: false },
  { id: 'colectivos', href: WHATSAPP_LINK, external: true },
  { id: 'restauracion', href: '/blog', external: false }
]

export function StoryHighlightsSection({ dictionary }: StoryHighlightsSectionProps) {
  const highlights = HIGHLIGHT_CONFIG.map(config => {
    const item = dictionary.items[config.id]
    return {
      ...config,
      eyebrow: item.eyebrow,
      title: item.title,
      description: item.description,
      bullets: item.bullets,
      cta: {
        label: item.cta,
        href: config.href,
        external: config.external
      }
    }
  })

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
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">{dictionary.eyebrow}</p>
          <h2 className="text-3xl font-semibold text-neutral-900">{dictionary.title}</h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {dictionary.description}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map(highlight => (
            <article
              key={highlight.id}
              className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white px-5 py-6 shadow-sm"
            >
              <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-600">{highlight.eyebrow}</p>
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
