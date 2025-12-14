import Link from 'next/link'
import { Metadata } from 'next'
import { CONTACT_NAME, INSTAGRAM_URL, WHATSAPP_LINK } from '@/lib/contact'
import { absoluteUrl, siteMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { ContactQuickForm } from '@/components/contact/ContactQuickForm'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbenos o ven al taller. Horarios, dirección y datos para encargos personalizados.',
  alternates: {
    canonical: absoluteUrl('/contacto')
  },
  openGraph: {
    title: `${siteMetadata.name} · Contacto`,
    description: 'Escríbenos o ven al taller para encargos de calcetines tradicionales.',
    url: absoluteUrl('/contacto'),
    type: 'website'
  }
}

export default function ContactPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Inicio', url: '/' },
    { name: 'Contacto', url: '/contacto' }
  ])

  return (
    <div className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Contacto</p>
          <h1 className="text-4xl font-semibold text-neutral-900">Hablemos de tu par de calcetines</h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            En La Tortugueta respondemos personalmente a cada encargo. Cuéntanos la historia que quieres reproducir,
            envíanos fotos o visita el taller de Alcoi. También puedes escribirnos a través de WhatsApp o correo electrónico.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Datos de contacto</h2>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li>
              <strong className="text-xs uppercase tracking-[0.3em] text-neutral-500">WhatsApp</strong>
              <p className="mt-1 text-base text-neutral-900">
                <Link href={WHATSAPP_LINK} className="underline">
                  {WHATSAPP_LINK.replace(/^https?:\/\//, '')}
                </Link>
              </p>
            </li>
            <li>
              <strong className="text-xs uppercase tracking-[0.3em] text-neutral-500">Correo electrónico</strong>
              <p className="mt-1 text-base text-neutral-900">
                <a href="mailto:hola@latortugueta.com" className="underline">
                  hola@latortugueta.com
                </a>
              </p>
            </li>
            <li>
              <strong className="text-xs uppercase tracking-[0.3em] text-neutral-500">Dirección</strong>
              <p className="mt-1 text-base text-neutral-900">C/ San Nicolás 12, 03801 Alcoy (Alicante)</p>
              <p className="text-xs text-neutral-400">Visitas con cita previa.</p>
            </li>
            <li>
              <strong className="text-xs uppercase tracking-[0.3em] text-neutral-500">RRSS</strong>
              <p className="mt-1 text-base text-neutral-900">
                <a href={INSTAGRAM_URL} className="underline">
                  Instagram @latortugueta.calcetines
                </a>
              </p>
            </li>
          </ul>

          <div className="space-y-2 text-sm text-neutral-600">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Horario de atención</p>
            <p className="mt-1 text-base text-neutral-900">
              Lunes a Sábado<br />
              <span className="text-sm text-neutral-500">Atención por WhatsApp disponible en cualquier momento.</span>
            </p>
            <p>Pedidos online 24/7 con respuesta en 24–48h laborables.</p>
          </div>
        </div>

        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Mapa y formulario rápido</h2>
          <div className="mt-12 h-64 w-full overflow-hidden rounded-3xl grayscale filter">
            {/* Map removed or updated to generic Alcoy view if preferred, or kept as is but pointing to Alcoy general */}
            <iframe
              title="Ubicación"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12715.8454108726833!2d-0.48!3d38.70!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd6234ef2899ca11%3A0x28ed5c828a7ea50!2sAlcoy%2C%20Alicante!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses"
            />
          </div>
          <ContactQuickForm />
        </div>
      </section>
    </div>
  )
}
