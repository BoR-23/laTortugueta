import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Uso de cookies y mecanismos de aceptación en el sitio web de La Tortugueta.',
  alternates: {
    canonical: absoluteUrl('/cookies')
  }
}

const cookieList = [
  {
    name: 'NEXT_LOCALE',
    purpose: 'Idioma preferido para la interfaz.',
    duration: 'Sesión',
    provider: 'Next.js'
  },
  {
    name: 'cf_clearance',
    purpose: 'Protección contra bots mediante Cloudflare.',
    duration: '1 hora',
    provider: 'Cloudflare'
  },
  {
    name: 'fbp',
    purpose: 'Análisis de rendimiento y marketing (Google Analytics/Meta).',
    duration: '3 meses',
    provider: 'Meta'
  }
]

export default function CookiesPage() {
  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Legal</p>
          <h1 className="text-4xl font-semibold text-neutral-900">Cookies</h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            Usamos cookies necesarias para el funcionamiento del sitio y opcionales para estadísticas y marketing. Puedes rechazarlas o configurar tus preferencias en tu navegador.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
              <tr>
                <th className="px-4 py-3">Cookie</th>
                <th className="px-4 py-3">Finalidad</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Proveedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {cookieList.map(cookie => (
                <tr key={cookie.name}>
                  <td className="px-4 py-4 font-semibold text-neutral-900">{cookie.name}</td>
                  <td className="px-4 py-4">{cookie.purpose}</td>
                  <td className="px-4 py-4">{cookie.duration}</td>
                  <td className="px-4 py-4">{cookie.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-600">
          Para gestionar tus preferencias puedes usar las funciones nativas del navegador o instalar extensiones de privacidad. Las cookies necesarias siempre están habilitadas para que el sitio funcione correctamente.
        </p>
      </section>
    </div>
  )
}
