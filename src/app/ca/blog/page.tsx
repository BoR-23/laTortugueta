import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { buildBlogListingJsonLd, absoluteUrl, siteMetadata } from '@/lib/seo'
import { BlogIndex } from '@/components/blog/BlogIndex'
import { dictionaries } from '@/i18n/dictionaries'

export const metadata: Metadata = {
    title: dictionaries.ca.blog.title,
    description: dictionaries.ca.blog.description,
    alternates: {
        canonical: '/ca/blog',
        languages: {
            'es': '/blog',
            'ca': '/ca/blog',
            'en': '/en/blog'
        }
    },
    openGraph: {
        title: `${siteMetadata.name} · ${dictionaries.ca.blog.title}`,
        description: dictionaries.ca.blog.description,
        url: absoluteUrl('/ca/blog'),
        type: 'website'
    }
}

export default async function BlogIndexPageCa() {
    const posts = await getAllPosts('ca')
    const blogJsonLd = buildBlogListingJsonLd(posts)

    return (
        <>
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
            />
            <BlogIndex posts={posts} locale="ca" />
        </>
    )
}
