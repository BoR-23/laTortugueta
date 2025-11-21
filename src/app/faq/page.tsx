import type { Metadata } from 'next'
import { absoluteUrl, siteMetadata } from '@/lib/seo'

const faqs = [
  {
    question: '¿Cómo se hacen los calcetines?',
    answer:
      'Cada par es único y se teje a mano en telares manuales. No trabajamos con stock estándar: confeccionamos cada calcetín a medida según número de pie, altura de caña y ancho de gemelo. Marcamos los colores en la etiqueta antes de tejer. Usamos exclusivamente algodón 100% Guisa.'
  },
  {
    question: '¿Cuánto tarda un pedido?',
    answer:
      'Entre 15 y 40 días según época y carga de trabajo. No aceptamos encargos urgentes: el proceso es 100% artesanal.'
  },
  {
    question: '¿Cómo se cuidan los calcetines?',
    answer:
      'Lavado: siempre a mano con agua fría y jabón neutro, sin frotar. Secado: nada de secadora ni tenderlos; sécalos entre dos toallas. Colocación: uñas cortas y ponlos desde la punta del pie, subiendo poco a poco para evitar enganches.'
  },
  {
    question: '¿Puedo personalizar colores o diseño?',
    answer:
      'Sí. Te enviamos la carta de colores; el precio base cubre hasta 3 colores. Diseños con 4+ colores (ej. rayas de 10) llevan recargo bajo presupuesto. Podemos recrear modelos antiguos si nos envías una foto. Tallas grandes (44+) o cañas muy altas llevan suplemento.'
  },
  {
    question: '¿Hacéis envíos internacionales?',
    answer: 'Sí. Enviamos a España, Europa y resto del mundo con seguimiento. El coste exacto se calcula en el momento del pago.'
  },
  {
    question: '¿Tienes otra duda?',
    answer: 'Escríbenos y te respondemos encantados sobre confección, tiempos, colores o cuidado de los calcetines.'
  }
]

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description:
    'Resolvemos dudas sobre confección, tiempos, personalización, envíos y cuidado de los calcetines artesanales de La Tortugueta.',
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
