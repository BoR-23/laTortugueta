import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { buildBlogListingJsonLd, absoluteUrl, siteMetadata } from '@/lib/seo'
import { BlogIndex } from '@/components/blog/BlogIndex'
import { dictionaries } from '@/i18n/dictionaries'

export const metadata: Metadata = {
    title: dictionaries.en.blog.title,
    description: dictionaries.en.blog.description,
    alternates: {
        canonical: '/en/blog',
        languages: {
            'es': '/blog',
            'ca': '/ca/blog',
            'en': '/en/blog'
        }
    },
    openGraph: {
        title: `${siteMetadata.name} · ${dictionaries.en.blog.title}`,
        description: dictionaries.en.blog.description,
        url: absoluteUrl('/en/blog'),
        type: 'website'
    }
}

export default async function BlogIndexPageEn() {
    const posts = await getAllPosts('en')
    const blogJsonLd = buildBlogListingJsonLd(posts)

    return (
        <>
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
            />
            <BlogIndex posts={posts} locale="en" />
        </>
    )
}
