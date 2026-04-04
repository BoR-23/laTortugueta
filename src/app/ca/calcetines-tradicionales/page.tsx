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
  title: 'Calcetins Tradicionals Valencians Fets a Mà',
  description:
    'Descobreix els nostres calcetins tradicionals valencians, fets a mà amb tècniques artesanals. Dissenys únics, materials naturals i encàrrecs personalitzats.',
  alternates: {
    canonical: absoluteUrl('/ca/calcetines-tradicionales'),
    languages: {
      es: '/calcetines-tradicionales',
      ca: '/ca/calcetines-tradicionales',
      en: '/en/calcetines-tradicionales'
    }
  },
  openGraph: {
    title: 'Calcetins Tradicionals Valencians | La Tortugueta',
    description:
      'Pàgina pilar sobre calcetins tradicionals valencians, models artesanals, procés de confecció i encàrrecs personalitzats.',
    url: absoluteUrl('/ca/calcetines-tradicionales'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calcetins Tradicionals Valencians | La Tortugueta',
    description:
      'Guia completa sobre calcetins tradicionals valencians, models artesanals i la col·lecció actual.'
  }
}

const faqEntries = [
  {
    question: 'Què són els calcetins tradicionals valencians?',
    answer:
      'Són calcetins inspirats en models històrics de la indumentària valenciana, teixits amb fils de qualitat i acabats artesanals per a roba tradicional, danses i recreació històrica.'
  },
  {
    question: 'En què es diferencien dels calcetins industrials?',
    answer:
      'La diferència principal està en la cura del disseny, la selecció del fil, la personalització per talla i color, i el treball artesanal pensat per respectar l’estètica tradicional.'
  },
  {
    question: 'Quina talla he de triar?',
    answer:
      'Treballem sobre la talla real del peu i podem ajustar alçada de canya o amplària si cal. Si tens dubtes, el millor és escriure’ns abans de produir.'
  },
  {
    question: 'Es poden personalitzar colors o dibuixos?',
    answer:
      'Sí. La Tortugueta treballa per encàrrec i pot adaptar colors, combinacions i referències històriques perquè el calcetí encaixe amb la teua indumentària o amb un model antic.'
  }
]

export default async function TraditionalSocksPageCa() {
  const products = await getAllProducts()
  const featuredProducts = products
    .filter(product => product.price > 0 && product.image)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .slice(0, 6)

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Inici', url: '/ca' },
    { name: 'Calcetins Tradicionals', url: '/ca/calcetines-tradicionales' }
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
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Guia principal</p>
            <h1 className="text-4xl font-semibold text-neutral-900 sm:text-5xl">
              Calcetins Tradicionals Valencians
            </h1>
            <p className="text-lg leading-relaxed text-neutral-700">
              A La Tortugueta entenem els calcetins tradicionals com una peça essencial de la indumentària, no com
              un accessori secundari. Per això documentem models antics, estudiem materials i reproduïm cada disseny
              amb una mirada artesanal que uneix memòria tèxtil i ús actual.
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
              Aquesta pàgina reuneix la base de la nostra col·lecció, el procés de treball i les respostes que més
              busquen les persones que cerquen calcetins tradicionals valencians per a roba tradicional, danses o
              recreació històrica.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs uppercase tracking-[0.3em]">
              <Link href="/#catalogo" className="rounded-full bg-neutral-900 px-6 py-3 text-white">
                Veure col·lecció
              </Link>
              <Link href="/contacto" className="rounded-full border border-neutral-900 px-6 py-3 text-neutral-900">
                Demanar assessorament
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
            <h2 className="text-3xl font-semibold text-neutral-900">Una tradició tèxtil ben viva</h2>
            <p>
              Els calcetins tradicionals valencians formen part del llenguatge visual de la indumentària popular.
              Parlen d’ofici, de territori i d’una manera de vestir on cada detall té intenció.
            </p>
            <p>
              El nostre treball parteix de l’arxiu i de l’observació. Revisem models antics, estudiem referències
              conservades en col·leccions particulars i traslladem eixa informació a peces que es puguen vestir hui
              amb comoditat.
            </p>
            <p>
              Si busques <strong>calcetins tradicionals valencians</strong>, ací trobaràs una col·lecció viva:
              materials de qualitat, confecció cuidada i atenció directa abans d’acceptar l’encàrrec.
            </p>
            <p>
              També treballem la personalització. Moltes persones arriben amb una foto antiga, una referència familiar
              o una combinació cromàtica molt concreta. En eixos casos, el catàleg és el punt de partida, no el límit.
              Pots consultar la <Link href="/colores" className="underline underline-offset-4">carta de colors</Link>,
              revisar el <Link href="/ca/blog" className="underline underline-offset-4">blog</Link> i escriure’ns per adaptar la peça.
            </p>
          </div>

          <aside className="space-y-4 rounded-3xl border border-neutral-200 bg-stone-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Per què triar-los</p>
            <h3 className="text-2xl font-semibold text-neutral-900">Què cuidem en cada parell</h3>
            <ul className="space-y-3 text-sm leading-relaxed text-neutral-700">
              <li>Documentació de models històrics i reinterpretació amb criteri.</li>
              <li>Selecció de fils i colors pensats per a l’ús i la durabilitat.</li>
              <li>Treball per encàrrec adaptat a talla, alçada de canya i combinacions cromàtiques.</li>
              <li>Atenció directa per resoldre dubtes abans de confirmar l’encàrrec.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Col·lecció destacada</p>
              <h2 className="text-3xl font-semibold text-neutral-900">Models artesanals de la col·lecció</h2>
            </div>
            <Link href="/#catalogo" className="text-xs uppercase tracking-[0.3em] text-neutral-600 underline underline-offset-4">
              Veure col·lecció completa
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
                    {product.category ?? 'Col·lecció artesanal'}
                  </p>
                  <h3 className="text-lg font-semibold text-neutral-900">{product.name}</h3>
                  <p className="text-sm text-neutral-600">{product.price.toFixed(2)} €</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">FAQ</p>
            <h2 className="text-3xl font-semibold text-neutral-900">Preguntes freqüents</h2>
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
          <h2 className="mt-4 text-3xl font-semibold">Troba el teu pròxim parell</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs uppercase tracking-[0.3em]">
            <Link href="/#catalogo" className="rounded-full bg-white px-6 py-3 text-neutral-900">
              Veure col·lecció
            </Link>
            <Link href="/contacto" className="rounded-full border border-white/40 px-6 py-3 text-white">
              Contactar amb La Tortugueta
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
