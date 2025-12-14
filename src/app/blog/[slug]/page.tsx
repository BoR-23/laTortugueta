import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import { renderMarkdown } from '@/lib/markdown'
import {
  absoluteUrl,
  buildArticleJsonLd,
  defaultOpenGraphImage,
  siteMetadata
} from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

type BlogPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const generateStaticParams = async () => {
  const posts = await getAllPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export const generateMetadata = async ({ params }: BlogPageProps): Promise<Metadata> => {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) {
    return {
      title: 'Entrada no encontrada · La Tortugueta'
    }
  }

  const url = absoluteUrl(`/blog/${post.slug}`)

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || siteMetadata.description,
      url,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      siteName: siteMetadata.name,
      images: [
        {
          url: post.image ? absoluteUrl(post.image) : defaultOpenGraphImage,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || siteMetadata.description,
      images: [post.image ? absoluteUrl(post.image) : defaultOpenGraphImage]
    }
  }
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date(value))

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const html = renderMarkdown(post.content)
  const articleJsonLd = buildArticleJsonLd(post)
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title, current: true }
  ]

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <article className="bg-white text-neutral-900">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            {formatDate(post.date)}
          </p>
          <h1 className="text-4xl font-semibold text-neutral-900">{post.title}</h1>
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Per {post.author}
          </p>
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-xs uppercase tracking-[0.3em] text-neutral-500">
            <Link href="/blog" className="hover:text-neutral-900">
              ← Tornar al blog
            </Link>
            <div className="flex flex-wrap gap-3">
              {post.tags.map(tag => (
                <span key={tag} className="rounded-full border border-neutral-200 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
