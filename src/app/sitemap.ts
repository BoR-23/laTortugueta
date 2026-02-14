import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/products'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl, getPrimaryProductImage } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([getAllProducts(), getAllPosts()])
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/colores'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/blog'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/quienes-somos'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contacto'), changeFrequency: 'monthly', priority: 0.5 }
  ]

  const now = new Date()

  entries.push(
    ...products.map(product => ({
      url: absoluteUrl(`/${product.id}`),
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: [getPrimaryProductImage(product)]
    }))
  )

  entries.push(
    ...posts.map(post => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  )

  return entries
}
