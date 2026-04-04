import type { Metadata } from 'next'
import Link from 'next/link'

import { ProductImage } from '@/components/common/ProductImage'
import { getAllProducts } from '@/lib/products'
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildProductAltText,
  siteMetadata
} from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calcetines Tradicionales Valencianos Hechos a Mano',
  description:
    'Descubre nuestros calcetines tradicionales valencianos, hechos a mano con técnicas artesanales. Diseños únicos, materiales naturales y encargos personalizados.',
  alternates: {
    canonical: absoluteUrl('/calcetines-tradicionales')
  },
  openGraph: {
    title: 'Calcetines Tradicionales Valencianos | La Tortugueta',
    description:
      'Página pilar de La Tortugueta sobre calcetines tradicionales valencianos, colección artesanal, proceso de confección y encargos personalizados.',
    url: absoluteUrl('/calcetines-tradicionales'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calcetines Tradicionales Valencianos | La Tortugueta',
    description:
      'Guía completa sobre calcetines tradicionales valencianos, modelos artesanales y colección disponible.'
  }
}

const faqEntries = [
  {
    question: '¿Qué son los calcetines tradicionales valencianos?',
    answer:
      'Son calcetines inspirados en modelos históricos de la indumentaria valenciana, tejidos con materiales de calidad y acabados artesanales para fallas, danses y vestimenta tradicional.'
  },
  {
    question: '¿En qué se diferencian de los calcetines industriales?',
    answer:
      'La principal diferencia está en el cuidado del diseño, la selección del hilo, la personalización por talla y color, y el trabajo artesanal pensado para respetar la estética tradicional.'
  },
  {
    question: '¿Qué talla debo elegir?',
    answer:
      'Trabajamos sobre la talla real del pie y podemos ajustar altura de caña o ancho si el encargo lo necesita. Si dudas, lo mejor es escribirnos y te orientamos antes de producir.'
  },
  {
    question: '¿Se pueden personalizar colores o dibujos?',
    answer:
      'Sí. La Tortugueta trabaja bajo pedido y puede adaptar colores, combinaciones y referencias históricas para que el calcetín encaje con tu indumentaria o con un diseño antiguo.'
  }
]

export default async function TraditionalSocksPage() {
  const products = await getAllProducts()
  const featuredProducts = products
    .filter(product => product.price > 0 && product.image)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .slice(0, 6)

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Inicio', url: '/' },
    { name: 'Calcetines Tradicionales', url: '/calcetines-tradicionales' }
  ])
  const faqJsonLd = buildFaqPageJsonLd(faqEntries)

  return (
    <div className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbJsonLd, faqJsonLd]) }}
      />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-stone-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Guía principal</p>
            <h1 className="text-4xl font-semibold text-neutral-900 sm:text-5xl">
              Calcetines Tradicionales Valencianos
            </h1>
            <p className="text-lg leading-relaxed text-neutral-700">
              En La Tortugueta entendemos los calcetines tradicionales como una pieza esencial de la indumentaria,
              no como un accesorio secundario. Por eso documentamos modelos antiguos, estudiamos materiales y
              reproducimos cada diseño con una mirada artesanal que une memoria textil y uso actual.
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
              Esta página reúne la base de nuestra colección, el proceso de trabajo y las respuestas que más nos
              hacen quienes buscan calcetines tradicionales valencianos para fallera, fallero, grupos de danses o
              recreación histórica.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs uppercase tracking-[0.3em]">
              <Link href="/#catalogo" className="rounded-full bg-neutral-900 px-6 py-3 text-white">
                Ver colección
              </Link>
              <Link href="/contacto" className="rounded-full border border-neutral-900 px-6 py-3 text-neutral-900">
                Pedir asesoramiento
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
            <h2 className="text-3xl font-semibold text-neutral-900">
              Una tradición textil que sigue viva
            </h2>
            <p>
              Los calcetines tradicionales valencianos forman parte del conjunto visual que da identidad a la
              indumentaria popular. Hablan de oficio, de territorio y de una manera de vestir donde cada detalle
              tiene intención. El dibujo, la caña, el color o la textura cambian la presencia del conjunto y por
              eso conviene tratarlos con el mismo respeto que un jubón, una falda o un delantal.
            </p>
            <p>
              Nuestro trabajo parte del archivo y de la observación. Revisamos modelos antiguos, estudiamos
              referencias conservadas en colecciones particulares y trasladamos esa información a piezas que puedan
              usarse hoy con comodidad. No buscamos una copia vacía: buscamos una reproducción fiel, útil y bien
              resuelta para quien quiere vestir tradición con rigor.
            </p>
            <p>
              Si vienes buscando <strong>calcetines tradicionales valencianos</strong>, aquí encontrarás una
              colección viva. Algunos diseños son sobrios y otros más ornamentales; unos están pensados para uso
              frecuente y otros para completar conjuntos muy concretos. Todos comparten la misma lógica: buena
              materia prima, confección cuidada y una atención personal antes de aceptar el encargo.
            </p>
            <p>
              También trabajamos la personalización. Muchas personas llegan con una referencia familiar, una foto
              antigua o una idea concreta de combinación cromática. En esos casos, el catálogo es el punto de
              partida, no el límite. Puedes ver nuestra <Link href="/colores" className="underline underline-offset-4">carta de colores</Link>,
              estudiar modelos del <Link href="/blog" className="underline underline-offset-4">blog</Link> y escribirnos para
              adaptar la pieza.
            </p>
          </div>

          <aside className="space-y-4 rounded-3xl border border-neutral-200 bg-stone-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Por qué elegirlos</p>
            <h3 className="text-2xl font-semibold text-neutral-900">Qué cuidamos en cada par</h3>
            <ul className="space-y-3 text-sm leading-relaxed text-neutral-700">
              <li>Documentación de modelos históricos y reinterpretación con criterio.</li>
              <li>Selección de hilos y colores pensados para aguantar el uso y el lavado.</li>
              <li>Trabajo bajo pedido para ajustar talla, altura de caña y combinación cromática.</li>
              <li>Atención directa para resolver dudas antes de confirmar el encargo.</li>
            </ul>
            <p className="text-sm text-neutral-600">
              Si quieres comparar diseños concretos, visita el <Link href="/#catalogo" className="underline underline-offset-4">catálogo completo</Link> o
              explora nuestra selección destacada más abajo.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Colección destacada</p>
              <h2 className="text-3xl font-semibold text-neutral-900">Modelos artesanales de la colección</h2>
              <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
                Una selección de modelos disponibles para usar como referencia de estilo, color y precio antes de
                hacer tu pedido.
              </p>
            </div>
            <Link href="/#catalogo" className="text-xs uppercase tracking-[0.3em] text-neutral-600 underline underline-offset-4">
              Ver colección completa
            </Link>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/${product.id}`}
                className="group space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-900"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white">
                  <ProductImage
                    imagePath={product.image}
                    variant="thumb"
                    alt={buildProductAltText({
                      name: product.name,
                      color: product.color,
                      category: product.category,
                      viewIndex: index
                    })}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 90vw"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {product.category ?? 'Colección artesanal'}
                  </p>
                  <h3 className="text-lg font-semibold text-neutral-900">{product.name}</h3>
                  <p className="text-sm text-neutral-600">
                    {product.price.toFixed(2)} €
                    <span className="ml-1 text-xs uppercase tracking-[0.2em] text-neutral-400">+ envío</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-3 rounded-3xl border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Paso 1</p>
            <h2 className="text-2xl font-semibold text-neutral-900">Elegimos la referencia</h2>
            <p className="text-sm leading-relaxed text-neutral-700">
              Partimos del catálogo, de una fotografía antigua o de una necesidad concreta de indumentaria para
              definir la base del diseño.
            </p>
          </div>
          <div className="space-y-3 rounded-3xl border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Paso 2</p>
            <h2 className="text-2xl font-semibold text-neutral-900">Ajustamos color y talla</h2>
            <p className="text-sm leading-relaxed text-neutral-700">
              Revisamos talla, gama cromática y cualquier particularidad del encargo para que el resultado encaje
              visualmente y también en el uso real.
            </p>
          </div>
          <div className="space-y-3 rounded-3xl border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Paso 3</p>
            <h2 className="text-2xl font-semibold text-neutral-900">Confeccionamos bajo pedido</h2>
            <p className="text-sm leading-relaxed text-neutral-700">
              La producción se hace con criterio artesanal, priorizando acabados, consistencia del tejido y una
              entrega alineada con el tipo de pieza solicitada.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-5 text-sm leading-relaxed text-neutral-700">
            <h2 className="text-3xl font-semibold text-neutral-900">Cómo elegir un buen modelo</h2>
            <p>
              Un buen calcetín tradicional no depende solo del dibujo. Conviene mirar el tipo de acto donde se va a
              usar, la combinación con el resto de la indumentaria, la estación del año y la frecuencia de uso.
              Para una persona que participa de manera habitual en fallas o danses, la durabilidad del hilo y el
              equilibrio del color son tan importantes como la fidelidad histórica.
            </p>
            <p>
              Por eso recomendamos empezar por tres preguntas: qué conjunto quieres completar, qué referencias
              visuales tienes y si buscas una pieza sobria o una pieza con más carácter. A partir de ahí es mucho
              más fácil decidir entre modelos lisos, rayados o con mayor presencia ornamental. Si necesitas más
              contexto, en el blog encontrarás la guía sobre{' '}
              <Link
                href="/blog/como-elegir-calcetines-tradicionales-calidad"
                className="underline underline-offset-4"
              >
                cómo elegir calcetines tradicionales de calidad
              </Link>{' '}
              y un recorrido por la{' '}
              <Link
                href="/blog/historia-calcetines-tradicionales-valencianos"
                className="underline underline-offset-4"
              >
                historia de los calcetines tradicionales valencianos
              </Link>.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-neutral-200 bg-stone-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Recursos relacionados</p>
            <ul className="space-y-3 text-sm leading-relaxed text-neutral-700">
              <li>
                <Link href="/colores" className="underline underline-offset-4">
                  Carta de colores
                </Link>{' '}
                para preparar combinaciones antes del encargo.
              </li>
              <li>
                <Link href="/quienes-somos" className="underline underline-offset-4">
                  Quiénes somos
                </Link>{' '}
                para conocer el taller y la trayectoria de La Tortugueta.
              </li>
              <li>
                <Link href="/contacto" className="underline underline-offset-4">
                  Contacto
                </Link>{' '}
                si quieres pedir una recomendación o resolver dudas de talla y diseño.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">FAQ</p>
            <h2 className="text-3xl font-semibold text-neutral-900">Preguntas frecuentes</h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqEntries.map(entry => (
              <article key={entry.question} className="rounded-3xl border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900">{entry.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">{entry.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">{siteMetadata.shortDescription}</p>
          <h2 className="mt-4 text-3xl font-semibold">Encuentra tu próximo par</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
            Si estás buscando calcetines tradicionales valencianos hechos con criterio artesanal, aquí tienes el
            mejor punto de partida: catálogo, color, contexto histórico y atención directa en un mismo lugar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs uppercase tracking-[0.3em]">
            <Link href="/#catalogo" className="rounded-full bg-white px-6 py-3 text-neutral-900">
              Ver colección
            </Link>
            <Link href="/contacto" className="rounded-full border border-white/40 px-6 py-3 text-white">
              Hablar con La Tortugueta
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
