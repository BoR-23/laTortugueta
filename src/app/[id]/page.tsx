import type { Metadata } from 'next'
import { getAllProductIds, getProductData } from '@/lib/products'
import { notFound } from 'next/navigation'
import { ProductShowcase } from '@/components/product/ProductShowcase'
import { getRecommendationsForProduct } from '@/lib/recommendations'
import {
  absoluteUrl,
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductAltText,
  getPrimaryProductImage
} from '@/lib/seo'
import { buildProductMetaDescription } from '@/lib/productEditorial'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getSiteSettings } from '@/lib/settings'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export const revalidate = 600

export async function generateStaticParams() {
  const productIds = await getAllProductIds()
  return productIds
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await getProductData(id)

    // SEO: Título específico para producto
    const title = `${product.name} | Calcetines Tradicionales`

    const description = buildProductMetaDescription(product)

    const url = absoluteUrl(`/${product.id}`)
    const image = getPrimaryProductImage(product)

    return {
      title,
      description,
      alternates: {
        canonical: url
      },
      openGraph: {
        title,
        description,
        type: 'article',
        url,
        images: image
          ? [
            {
              url: image,
              alt: buildProductAltText({
                name: product.name,
                color: product.color,
                category: product.category
              })
            }
          ]
          : undefined
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined
      }
    }
  } catch {
    notFound()
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  try {
    const product = await getProductData(id)
    const recommendations = await getRecommendationsForProduct(id, 4)
    const siteSettings = await getSiteSettings()

    // Serialización segura para pasar datos a componentes cliente
    const safeProduct = JSON.parse(JSON.stringify(product))

    const jsonLd = [
      buildProductJsonLd(safeProduct),
      buildProductBreadcrumbJsonLd(safeProduct)
    ]
    const breadcrumbs = [
      { label: 'Inicio', href: '/' },
      { label: 'Catálogo', href: '/#catalogo' },
      { label: safeProduct.name, current: true }
    ]
    return (
      <>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Breadcrumbs items={[...breadcrumbs]} />
        <ProductShowcase
          product={safeProduct}
          recommendations={recommendations}
          showLocalSuggestions={siteSettings.enableLocalSuggestions}
        />
      </>
    )
  } catch {
    notFound()
  }
}
