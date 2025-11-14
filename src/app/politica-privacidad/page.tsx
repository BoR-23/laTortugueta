import type { Metadata } from 'next'
import { absoluteUrl, siteMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo recopilamos, usamos y protegemos los datos personales en La Tortugueta.',
  alternates: {
    canonical: absoluteUrl('/politica-privacidad')
  },
  openGraph: {
    title: `${siteMetadata.name} · Política de privacidad`,
    description: 'Información detallada sobre privacidad y tratamiento de datos en La Tortugueta.',
    url: absoluteUrl('/politica-privacidad')
  }
}

const sections = [
  {
    title: 'Datos que recopilamos',
    content:
      'Recogemos datos cuando contactas por WhatsApp, email, formulario o al contratar un pedido (nombre, contacto, tallas, colores, direcciones y detalles del diseño).'
  },
  {
    title: 'Finalidades',
    content:
      'Utilizamos los datos para responder consultas, preparar presupuestos, producir pedidos y enviar actualizaciones. No compartimos tus datos con terceros salvo con proveedores logísticos si hay un envío.'
  },
  {
    title: 'Derechos',
    content:
      'Puedes acceder, rectificar, suprimir o solicitar portabilidad en cualquier momento escribiendo a hola@latortugueta.com. También puedes oponerte a tratar tus datos o solicitar limitación.'
  },
  {
    title: 'Medidas de seguridad',
    content:
      'Protegemos la información con cifrado en tránsito, acceso restringido y revisiones periódicas. Guardamos sólo los datos necesarios mientras sea útil para cumplir los pedidos y obligaciones legales.'
  }
]

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Legal</p>
          <h1 className="text-4xl font-semibold text-neutral-900">Política de privacidad</h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            Esta política explica qué datos recogemos, por qué lo hacemos y cómo puedes ejercer tus derechos
            según la normativa europea (RGPD) y la ley española de protección de datos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {sections.map(section => (
          <article key={section.title} className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
            <p className="text-sm text-neutral-600">{section.content}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
