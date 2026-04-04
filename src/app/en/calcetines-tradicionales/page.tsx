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
  title: 'Traditional Valencian Socks Handmade',
  description:
    'Discover our traditional Valencian socks, handmade with artisanal techniques. Unique designs, natural materials and bespoke orders.',
  alternates: {
    canonical: absoluteUrl('/en/calcetines-tradicionales'),
    languages: {
      es: '/calcetines-tradicionales',
      ca: '/ca/calcetines-tradicionales',
      en: '/en/calcetines-tradicionales'
    }
  },
  openGraph: {
    title: 'Traditional Valencian Socks | La Tortugueta',
    description:
      'Pillar page about traditional Valencian socks, artisanal models, production process and bespoke orders.',
    url: absoluteUrl('/en/calcetines-tradicionales'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Traditional Valencian Socks | La Tortugueta',
    description:
      'Complete guide to traditional Valencian socks, artisanal models and the current collection.'
  }
}

const faqEntries = [
  {
    question: 'What are traditional Valencian socks?',
    answer:
      'They are socks inspired by historical Valencian dress, made with quality yarns and artisanal finishes for folk dress, dances and historical clothing.'
  },
  {
    question: 'How are they different from industrial socks?',
    answer:
      'The main difference lies in the design care, yarn selection, size and colour personalisation, and the artisanal process shaped around traditional aesthetics.'
  },
  {
    question: 'How do I choose the right size?',
    answer:
      'We work from the real foot size and can adapt leg height or width when needed. If you are unsure, the best option is to contact us before production.'
  },
  {
    question: 'Can colours or motifs be customised?',
    answer:
      'Yes. La Tortugueta works by order and can adapt colours, combinations and historical references so the sock fits your dress or an old family model.'
  }
]

export default async function TraditionalSocksPageEn() {
  const products = await getAllProducts()
  const featuredProducts = products
    .filter(product => product.price > 0 && product.image)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .slice(0, 6)

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: '/en' },
    { name: 'Traditional Socks', url: '/en/calcetines-tradicionales' }
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
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Main guide</p>
            <h1 className="text-4xl font-semibold text-neutral-900 sm:text-5xl">
              Traditional Valencian Socks
            </h1>
            <p className="text-lg leading-relaxed text-neutral-700">
              At La Tortugueta we understand traditional socks as an essential part of dress, not a secondary
              accessory. That is why we document old models, study materials and reproduce each design with an
              artisanal perspective that connects textile memory with present-day use.
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
              This page gathers the foundations of our collection, our working process and the answers most people
              look for when searching for traditional Valencian socks for folk dress, dances or historical reenactment.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs uppercase tracking-[0.3em]">
              <Link href="/#catalogo" className="rounded-full bg-neutral-900 px-6 py-3 text-white">
                View collection
              </Link>
              <Link href="/contacto" className="rounded-full border border-neutral-900 px-6 py-3 text-neutral-900">
                Ask for advice
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
            <h2 className="text-3xl font-semibold text-neutral-900">A living textile tradition</h2>
            <p>
              Traditional Valencian socks are part of the visual language of popular dress. They speak about craft,
              territory and a way of dressing where every detail has intention. Pattern, leg height, colour and texture
              all change the final balance of the outfit.
            </p>
            <p>
              Our work starts from archive and observation. We review historical models, study references kept in
              private collections and translate that information into pieces that can still be worn comfortably today.
            </p>
            <p>
              If you are searching for <strong>traditional Valencian socks</strong>, here you will find a living
              collection. Some models are sober, some are more ornamental, but all of them follow the same logic:
              quality materials, careful making and direct guidance before taking the order.
            </p>
            <p>
              We also work with customisation. Many clients arrive with an old photograph, a family reference or a
              very specific colour combination in mind. In those cases the catalogue is the starting point, not the
              limit. You can review our <Link href="/colores" className="underline underline-offset-4">colour chart</Link>,
              browse the <Link href="/en/blog" className="underline underline-offset-4">blog</Link> and contact us to adapt the piece.
            </p>
          </div>

          <aside className="space-y-4 rounded-3xl border border-neutral-200 bg-stone-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Why choose them</p>
            <h3 className="text-2xl font-semibold text-neutral-900">What we care for in every pair</h3>
            <ul className="space-y-3 text-sm leading-relaxed text-neutral-700">
              <li>Historical documentation and careful reinterpretation.</li>
              <li>Yarn and colour selection designed for use and durability.</li>
              <li>Made-to-order work adapted to size, leg height and colour combinations.</li>
              <li>Direct attention to solve questions before confirming an order.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Featured collection</p>
              <h2 className="text-3xl font-semibold text-neutral-900">Artisanal models from the collection</h2>
            </div>
            <Link href="/#catalogo" className="text-xs uppercase tracking-[0.3em] text-neutral-600 underline underline-offset-4">
              View full collection
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
                    {product.category ?? 'Artisanal collection'}
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
            <h2 className="text-3xl font-semibold text-neutral-900">Frequently asked questions</h2>
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
          <h2 className="mt-4 text-3xl font-semibold">Find your next pair</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs uppercase tracking-[0.3em]">
            <Link href="/#catalogo" className="rounded-full bg-white px-6 py-3 text-neutral-900">
              View collection
            </Link>
            <Link href="/contacto" className="rounded-full border border-white/40 px-6 py-3 text-white">
              Contact La Tortugueta
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
