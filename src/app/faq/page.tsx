import type { Metadata } from 'next'
import { absoluteUrl, siteMetadata } from '@/lib/seo'

const faqs = [
  {
    question: '¿Cómo se hacen los calcetines?',
    answer:
      'Cada par se teje a mano en telares históricos. Documentamos patrón, colores y etiquetas antes de comenzar el hilado.'
  },
  {
    question: '¿Cuánto tarda un pedido?',
    answer: 'Normalmente 15-20 días laborables. Los encargos urgentes tienen suplemento y necesitan confirmación previa.'
  },
  {
    question: '¿Cómo se cuidan los calcetines?',
    answer:
      'Lávalos a mano con agua fría, sin frotar en seco. Evita la secadora y usa jabón neutro. Si se desgastan revisamos reparaciones bajo pedido.'
  },
  {
    question: '¿Hacéis envíos internacionales?',
    answer: 'Sí. Enviamos a España, Europa y resto del mundo con seguimiento. Calculamos el coste en el momento del pago.'
  },
  {
    question: '¿Puedo cambiar una etiqueta o color?',
    answer:
      'Claro. Cada diseño se adapta a tu petición. Incluye detalles en el formulario o en WhatsApp y te mandamos presupuesto.'
  }
]

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Resolvemos dudas sobre pedidos, telas, envío y cuidado de los calcetines de La Tortugueta.',
  alternates: {
    canonical: absoluteUrl('/faq')
  }
}

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="bg-white text-neutral-900">
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">FAQ</p>
            <h1 className="text-4xl font-semibold text-neutral-900">Preguntas frecuentes</h1>
            <p className="text-sm leading-relaxed text-neutral-600">
              Resolvemos las dudas más comunes sobre la confección, los tiempos, el envío y el cuidado de tus calcetines artesanales.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
          {faqs.map(faq => (
            <article key={faq.question} className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">{faq.question}</h2>
              <p className="text-sm text-neutral-600">{faq.answer}</p>
            </article>
          ))}
        </section>
      </div>
    </>
  )
}
