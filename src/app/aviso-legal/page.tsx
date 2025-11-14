import type { Metadata } from 'next'
import { absoluteUrl, siteMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: 'Datos del responsable, condiciones de uso y propiedad intelectual de La Tortugueta.',
  alternates: {
    canonical: absoluteUrl('/aviso-legal')
  }
}

const legalPoints = [
  {
    title: 'Responsable',
    content:
      'La Tortugueta S.L. · C/ San Nicolás 12 · 03801 Alcoy · CIF: B01234567 · contacto@latortugueta.com'
  },
  {
    title: 'Objeto',
    content:
      'Esta web presenta el catálogo, blog y recursos sobre calcetines artesanales. El uso del sitio implica aceptar las condiciones aquí descritas.'
  },
  {
    title: 'Propiedad intelectual',
    content:
      'Los textos, imágenes y diseños son propiedad de La Tortugueta. Queda prohibida la reproducción sin autorización, salvo para uso privado.'
  },
  {
    title: 'Responsabilidad',
    content:
      'Hacemos todo lo posible para mantener la información actualizada. No obstante, no nos responsabilizamos de errores tipográficos o cambios de stock.'
  }
]

export default function LegalNoticePage() {
  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Legal</p>
          <h1 className="text-4xl font-semibold text-neutral-900">Aviso legal</h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            Información general sobre la titularidad del sitio, las condiciones de uso y los límites de responsabilidad.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {legalPoints.map(point => (
          <article key={point.title} className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">{point.title}</h2>
            <p className="text-sm text-neutral-600">{point.content}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
