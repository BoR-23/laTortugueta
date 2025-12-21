import type { Metadata } from 'next'
import { getAllProducts } from "@/lib/products"
// import { getAllProducts } from "@/lib/products/mock_repository"
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

import { ResolvingMetadata } from 'next'

export async function generateMetadata(
  props: {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: 'Catálogo de Calcetines Tradicionales | La Tortugueta Alcoi',
    description: siteMetadata.description,
    alternates: {
      canonical: absoluteUrl('/'),
    },
    openGraph: {
      title: `Catálogo · ${siteMetadata.name}`,
      description: siteMetadata.description,
      url: absoluteUrl('/'),
      type: 'website',
      images: previousImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Catálogo · ${siteMetadata.name}`,
      description: siteMetadata.description,
      images: previousImages,
    }
  }
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function Home() {
  const products = await getAllProducts()
  const catalogProducts = prepareCatalogProducts(products)
  const allCategories = await getCategories()
  const headerCategories = allCategories.filter(c => c.scope === 'header')
  const filterCategories = allCategories.filter(c => c.scope === 'filter')
  const siteSettings = await getSiteSettings()
  const slides = await getHeroSlides()

  const visibleProducts = catalogProducts.filter(product => product.price > 0)

  /* 
   Optimization: Compute top visited products on the server to avoid passing 
   the entire catalog to the client component. 
  */
  const topVisitedProducts = [...visibleProducts]
    .filter(product => (product.viewCount ?? 0) > 0)
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 6)

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
      <HeroCarousel slides={slides} />
      <div id="catalogo">
        <TagFilterPanelClient
          products={visibleProducts}
          headerCategories={mapCategoriesToDTO(headerCategories)}
          filterCategories={mapCategoriesToDTO(filterCategories)}
          settings={siteSettings}
        />
      </div>
      {siteSettings.enableTopVisited ? <TopVisitedSection products={topVisitedProducts} /> : null}
      <SeoContentSection />
      <TestimonialsSection show={enableTestimonials} />
      {siteSettings.enableStoryHighlights ? <StoryHighlightsSection /> : null}
      <HowToOrderSection />
    </>
  )
}
