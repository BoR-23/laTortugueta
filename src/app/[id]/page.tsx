import type { Metadata } from 'next'
import { getAllProductIds, getProductData } from '@/lib/products'
import { notFound } from 'next/navigation'
import { ProductShowcase } from '@/components/product/ProductShowcase'
import { getRecommendationsForProduct } from '@/lib/recommendations'
import {
  absoluteUrl,
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  getPrimaryProductImage
} from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getSiteSettings } from '@/lib/settings'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export const revalidate = 3600

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

    // SEO: Descripción enriquecida para evitar "thin content" / duplicidad
    const description =
      product.description?.slice(0, 160) ||
      `Calcetines modelo ${product.name}${product.category ? ` de la colección ${product.category}` : ''}. ` +
      `Bordados artesanales${product.color ? ` en tono ${product.color}` : ''}, perfectos para indumentaria valenciana y fallera.`

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
              alt: `Calcetines valencianos modelo ${product.name}`
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
