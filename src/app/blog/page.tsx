import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { buildBlogListingJsonLd, absoluteUrl, siteMetadata } from '@/lib/seo'
import { BlogIndex } from '@/components/blog/BlogIndex'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Relats i referències de la calceteria tradicional documentats per La Tortugueta.',
  alternates: {
    canonical: '/blog',
    languages: {
      'es': '/blog',
      'ca': '/ca/blog',
      'en': '/en/blog'
    }
  },
  openGraph: {
    title: `${siteMetadata.name} · Blog`,
    description:
      'Relats i referències de la calceteria tradicional documentats per La Tortugueta.',
    url: absoluteUrl('/blog'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteMetadata.name} · Blog`,
    description:
      'Relats i referències de la calceteria tradicional documentats per La Tortugueta.'
  }
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts('es')
  const blogJsonLd = buildBlogListingJsonLd(posts)

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogIndex posts={posts} locale="es" />
    </>
  )
}
