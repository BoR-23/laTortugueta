import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getAllProductIds, getProductData } from '@/lib/products'
import { notFound } from 'next/navigation'
import { ProductShowcase } from '@/components/product/ProductShowcase'
import { getRecommendationsForProduct } from '@/lib/recommendations'
import { authOptions } from '@/lib/auth'
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
    const title = product.name
    const description =
      product.description?.slice(0, 140) ||
      `Calcetines artesanales ${product.category ?? ''} – ${product.name}.`
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
                width: 1200,
                height: 630,
                alt: product.name
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
    return {
      title: 'Calcetín no encontrado · La Tortugueta',
      description: 'El producto solicitado no está disponible.'
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  try {
    const product = await getProductData(id)
    const recommendations = await getRecommendationsForProduct(id, 4)
    const [session, siteSettings] = await Promise.all([
      getServerSession(authOptions),
      getSiteSettings()
    ])
    const isAdmin = Boolean(session?.user?.role === 'admin')
    const jsonLd = [
      buildProductJsonLd(product),
      buildProductBreadcrumbJsonLd(product)
    ]
    const breadcrumbs = [
      { label: 'Inicio', href: '/' },
      { label: 'Catálogo', href: '/#colecciones' },
      { label: product.category ?? 'Catálogo', href: '/#colecciones' },
      { label: product.name, current: true }
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
          product={product}
          recommendations={recommendations}
          isAdmin={isAdmin}
          showLocalSuggestions={siteSettings.enableLocalSuggestions}
        />
      </>
    )
  } catch {
    notFound()
  }
}
