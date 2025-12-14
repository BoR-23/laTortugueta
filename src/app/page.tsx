import type { Metadata } from 'next'
import { getAllProducts } from "@/lib/products"
import { TagFilterPanelClient } from "@/components/catalog/TagFilterPanelClient"
import { prepareCatalogProducts } from "@/components/catalog/prepareCatalogProducts"
import { getCategories } from "@/lib/categories"
import { siteMetadata, absoluteUrl, buildCatalogJsonLd } from '@/lib/seo'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { HowToOrderSection } from '@/components/home/HowToOrderSection'
import { StoryHighlightsSection } from '@/components/home/StoryHighlightsSection'
import { TopVisitedSection } from '@/components/home/TopVisitedSection'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { getSiteSettings } from '@/lib/settings'
import { getHeroSlides } from '@/lib/banners'
import { SeoContentSection } from '@/components/home/SeoContentSection'

const mapCategoriesToDTO = (records: Awaited<ReturnType<typeof getCategories>>) =>
  records.map(record => ({
    id: record.id,
    scope: record.scope,
    name: record.name,
    tagKey: record.tagKey,
    parentId: record.parentId,
    order: record.order
  }))

const buildCategoryNameMap = (records: Awaited<ReturnType<typeof getCategories>>) => {
  const map = new Map<string, string>()
  records.forEach(record => {
    if (record.tagKey) {
      map.set(record.tagKey.toLowerCase(), record.name)
    }
  })
  return map
}

export const metadata: Metadata = {
  // CAMBIO SEO: Título optimizado ~55 caracteres (AIOSEO)
  title: 'Catálogo de Calcetines Tradicionales | La Tortugueta Alcoi',
  description: siteMetadata.description,
  alternates: {
    canonical: '/',
    languages: {
      'es': '/',
      'ca': '/ca',
      'en': '/en'
    }
  },
  openGraph: {
    title: `Catálogo · ${siteMetadata.name}`,
    description: siteMetadata.description,
    url: absoluteUrl('/'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `Catálogo · ${siteMetadata.name}`,
    description: siteMetadata.description
  }
}

export const revalidate = 60

export default async function Home() {
  const products = await getAllProducts()
  const catalogProducts = prepareCatalogProducts(products)
  const allCategories = await getCategories()
  const headerCategories = allCategories.filter(c => c.scope === 'header')
  const filterCategories = allCategories.filter(c => c.scope === 'filter')
  const siteSettings = await getSiteSettings()
  const slides = await getHeroSlides()

  const visibleProducts = catalogProducts.filter(product => product.price > 0)

  const catalogJsonLd = buildCatalogJsonLd(visibleProducts.length)
  const enableTestimonials =
    process.env.NEXT_PUBLIC_ENABLE_TESTIMONIALS !== 'false' && siteSettings.enableTestimonials

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
      <h1 className="sr-only">La Tortugueta: Calcetines Tradicionales y Valencianos</h1>
      <HeroCarousel slides={slides} />
      <div id="catalogo">
        <TagFilterPanelClient
          products={visibleProducts}
          headerCategories={mapCategoriesToDTO(headerCategories)}
          filterCategories={mapCategoriesToDTO(filterCategories)}
          settings={siteSettings}
        />
      </div>
      {siteSettings.enableTopVisited ? <TopVisitedSection products={visibleProducts} /> : null}
      <SeoContentSection />
      <TestimonialsSection show={enableTestimonials} />
      {siteSettings.enableStoryHighlights ? <StoryHighlightsSection /> : null}
      <HowToOrderSection />
    </>
  )
}
