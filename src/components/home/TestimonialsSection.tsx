'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  defaultTestimonials,
  defaultTestimonialGroups,
  type Testimonial,
  type TestimonialGroup
} from '@/lib/testimonials'
import { trackEvent } from '@/lib/analytics'

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
  groups?: TestimonialGroup[]
  show?: boolean
}

const CTA_TEXT = 'Pide una cita privada para ver el archivo completo.'
const FALLBACK_GROUP: TestimonialGroup = {
  id: 'general',
  label: 'Historias destacadas',
  description: 'Testimonios reales de equipos que ya confían en el archivo de calcetería.',
  testimonials: defaultTestimonials
}

export function TestimonialsSection({
  testimonials = defaultTestimonials,
  groups = defaultTestimonialGroups,
  show = true
}: TestimonialsSectionProps) {
  const [activeTags, setActiveTags] = useState<string[]>([])
  const groupsToRender = useMemo<TestimonialGroup[]>(() => {
    if (groups && groups.length) {
      return groups
    }
    if (testimonials.length) {
      return [
        {
          ...FALLBACK_GROUP,
          testimonials
        }
      ]
    }
    return []
  }, [groups, testimonials])

  const [activeGroupId, setActiveGroupId] = useState(groupsToRender[0]?.id)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleFiltersChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ tags?: string[] }>
      const tags = Array.isArray(customEvent.detail?.tags) ? customEvent.detail!.tags : []
      setActiveTags(tags)
    }

    window.addEventListener('catalog:filters-changed', handleFiltersChanged as EventListener)
    return () => {
      window.removeEventListener('catalog:filters-changed', handleFiltersChanged as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!groupsToRender.length) {
      return
    }
    if (!activeGroupId || !groupsToRender.some(group => group.id === activeGroupId)) {
      setActiveGroupId(groupsToRender[0].id)
    }
  }, [groupsToRender, activeGroupId])
  const normalizedActiveTags = useMemo(
    () => activeTags.map(tag => tag.toLowerCase()),
    [activeTags]
  )

  useEffect(() => {
    if (!normalizedActiveTags.length) {
      return
    }
    const matchedGroup = groupsToRender.find(group =>
      group.matchTags?.some(keyword => normalizedActiveTags.includes(keyword.toLowerCase()))
    )
    if (matchedGroup && matchedGroup.id !== activeGroupId) {
      setActiveGroupId(matchedGroup.id)
    }
  }, [normalizedActiveTags, groupsToRender, activeGroupId])

  if (!show || groupsToRender.length === 0) {
    return null
  }

  const activeGroup = groupsToRender.find(group => group.id === activeGroupId) ?? groupsToRender[0]
  const handleGroupClick = (groupId: string) => {
    setActiveGroupId(groupId)
    if (groupId !== activeGroupId) {
      trackEvent('testimonial_group_select', { groupId })
    }
  }

  const handleReserveCta = () => {
    trackEvent('cta_click', { location: 'testimonials_section', target: 'reserve_whatsapp' })
  }

  return (
    <section className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Que dicen los talleres</p>
          <h2 className="text-3xl font-semibold text-neutral-900">Confían en La Tortugueta</h2>
          <p className="text-sm text-neutral-600">
            Grupos de danzas, compañías de teatro y coleccionistas trabajan con nosotros porque documentamos cada pieza.
          </p>
        </div>

        {groupsToRender.length > 1 && (
          <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-neutral-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
              {groupsToRender.map(group => {
                const isActive = group.id === activeGroup.id
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupClick(group.id)}
                    className={`rounded-full border px-4 py-2 transition ${
                      isActive
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-transparent bg-white text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                    }`}
                    aria-pressed={isActive}
                  >
                    {group.label}
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-neutral-600 sm:max-w-xl">{activeGroup.description}</p>
          </div>
        )}

        {groupsToRender.length === 1 && activeGroup.description ? (
          <p className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-4 text-sm text-neutral-600">
            {activeGroup.description}
          </p>
        ) : null}

        {!activeGroup?.testimonials.length && (
          <p className="text-sm text-neutral-600">Todavía no hay testimonios publicados en esta categoría.</p>
        )}

        {activeGroup?.testimonials.length ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {activeGroup.testimonials.map((testimonial, index) => (
              <figure
                key={`${testimonial.name}-${index}`}
                className="flex h-full flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <blockquote className="text-base leading-relaxed text-neutral-700">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-4 space-y-1 text-sm uppercase tracking-[0.25em] text-neutral-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{testimonial.name}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-400">{testimonial.location}</span>
                  </div>
                  {testimonial.role && (
                    <div className="text-[11px] tracking-[0.35em] text-neutral-400">{testimonial.role}</div>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}

        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-5 text-sm text-neutral-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{CTA_TEXT}</p>
            <a
              href="https://wa.me/34653452249"
              className="inline-flex items-center justify-center rounded-full border border-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
              onClick={handleReserveCta}
            >
              Reservar cita
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
