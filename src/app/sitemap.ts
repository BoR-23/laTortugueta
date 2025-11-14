import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/products'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([getAllProducts(), getAllPosts()])
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/') },
    { url: absoluteUrl('/blog') },
    { url: absoluteUrl('/quienes-somos') }
  ]

  const now = new Date()

  entries.push(
    ...products.map(product => ({
      url: absoluteUrl(`/${product.id}`),
      lastModified: now
    }))
  )

  entries.push(
    ...posts.map(post => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date ? new Date(post.date) : now
    }))
  )

  return entries
}
