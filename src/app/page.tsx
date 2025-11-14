import type { Metadata } from 'next'
import { getAllProducts } from "@/lib/products"
import { TagFilterPanelClient } from "@/components/catalog/TagFilterPanelClient"
import { prepareCatalogProducts } from "@/components/catalog/prepareCatalogProducts"
import { getCategories } from "@/lib/categories"
import { siteMetadata, absoluteUrl, buildCatalogJsonLd } from '@/lib/seo'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'

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
  title: 'Catálogo',
  description: siteMetadata.description,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: `${siteMetadata.name} · Catálogo`,
    description: siteMetadata.description,
    url: absoluteUrl('/'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteMetadata.name} · Catálogo`,
    description: siteMetadata.description
  }
}

export default async function Home() {
  const products = await getAllProducts()
  const catalogProducts = prepareCatalogProducts(products)
  const [headerCategories, filterCategories] = await Promise.all([
    getCategories("header"),
    getCategories("filter")
  ])

  const headerNameMap = buildCategoryNameMap(headerCategories)
  const filterNameMap = buildCategoryNameMap(filterCategories)

  const enrichedProducts = catalogProducts.map(product => {
    const normalizedTags = (product.tags ?? []).map(tag => tag.toLowerCase())
    const match = normalizedTags.find(tag => filterNameMap.has(tag) || headerNameMap.has(tag))
    const displayName = match ? filterNameMap.get(match) ?? headerNameMap.get(match) : null
    return {
      ...product,
      category: displayName ?? product.category
    }
  })

  const catalogJsonLd = buildCatalogJsonLd(enrichedProducts.length)
  const enableTestimonials = process.env.NEXT_PUBLIC_ENABLE_TESTIMONIALS !== 'false'

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
      <TagFilterPanelClient
        products={enrichedProducts}
        headerCategories={mapCategoriesToDTO(headerCategories)}
        filterCategories={mapCategoriesToDTO(filterCategories)}
      />
      <TestimonialsSection show={enableTestimonials} />
    </>
  )
}
