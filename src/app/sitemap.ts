import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/products'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl, getPrimaryProductImage } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, postsEs, postsEn, postsCa] = await Promise.all([
    getAllProducts(),
    getAllPosts('es'),
    getAllPosts('en'),
    getAllPosts('ca')
  ])
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/en'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/ca'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/calcetines-tradicionales'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/en/calcetines-tradicionales'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/ca/calcetines-tradicionales'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/colores'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/blog'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/en/blog'), changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/ca/blog'), changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/quienes-somos'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/en/quienes-somos'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/ca/quienes-somos'), changeFrequency: 'monthly', priority: 0.4 },
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
    ...postsEs.map(post => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  )

  entries.push(
    ...postsEn.map(post => ({
      url: absoluteUrl(`/en/blog/${post.slug}`),
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.5
    }))
  )

  entries.push(
    ...postsCa.map(post => ({
      url: absoluteUrl(`/ca/blog/${post.slug}`),
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.5
    }))
  )

  return entries
}
