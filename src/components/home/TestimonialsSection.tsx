'use client'

import { defaultTestimonials, type Testimonial } from '@/lib/testimonials'
import Image from 'next/image'

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
  show?: boolean
}

const CTA_TEXT = 'Pide una cita privada para ver el archivo completo.'

export function TestimonialsSection({ testimonials = defaultTestimonials, show = true }: TestimonialsSectionProps) {
  if (!show || testimonials.length === 0) {
    return null
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
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <figure key={`${testimonial.name}-${index}`} className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <blockquote className="text-base leading-relaxed text-neutral-700">{testimonial.quote}</blockquote>
              <figcaption className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                {testimonial.name}
                <span className="ml-2 text-neutral-400">{testimonial.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-5 text-sm text-neutral-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {CTA_TEXT}
            </p>
            <a
              href="https://wa.me/34653452249"
              className="inline-flex items-center justify-center rounded-full border border-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            >
              Reservar cita
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
