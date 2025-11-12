import type { Metadata } from 'next'
import { getAllProductIds, getProductData } from '@/lib/products'
import { notFound } from 'next/navigation'
import { ProductShowcase } from '@/components/product/ProductShowcase'
import { getRecommendationsForProduct } from '@/lib/recommendations'

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
    const title = `${product.name} · La Tortugueta`
    const description =
      product.description?.slice(0, 140) ||
      `Calcetines artesanales ${product.category ?? ''} – ${product.name}.`
    const image = product.gallery[0] || product.image || '/favicon.ico'
    return {
      title,
      description,
      alternates: {
        canonical: `/${product.id}`
      },
      openGraph: {
        title,
        description,
        type: 'article',
        url: `/${product.id}`,
        images: image ? [{ url: image }] : undefined
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
    return <ProductShowcase product={product} recommendations={recommendations} />
  } catch {
    notFound()
  }
}
