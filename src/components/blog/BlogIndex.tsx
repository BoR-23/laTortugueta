import Link from 'next/link'
import { BlogPost } from '@/lib/blog'
import { renderMarkdown } from '@/lib/markdown'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { dictionaries, Locale } from '@/i18n/dictionaries'

interface BlogIndexProps {
    posts: BlogPost[]
    locale: Locale
}

export function BlogIndex({ posts, locale }: BlogIndexProps) {
    const t = dictionaries[locale].blog
    const navT = dictionaries[locale].nav

    const dateFormatter = new Intl.DateTimeFormat(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-US' : 'es-ES', {
        dateStyle: 'long'
    })

    const featuredPost = posts[0]
    const featuredHtml = featuredPost ? renderMarkdown(featuredPost.content) : ''

    const breadcrumbs = [
        { label: navT.home, href: locale === 'es' ? '/' : `/${locale}` },
        { label: navT.blog, current: true }
    ]

    return (
        <div className="bg-white text-neutral-900">
            <Breadcrumbs items={breadcrumbs} />
            <section className="border-b border-neutral-200 bg-white">
                <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">{t.subtitle}</p>
                    <h1 className="text-4xl font-semibold text-neutral-900 sm:text-5xl">
                        {t.title}
                    </h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
                        {t.description}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
                {posts.length === 0 ? (
                    <p className="text-sm leading-relaxed text-neutral-600">
                        {t.empty}
                    </p>
                ) : (
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
                        <article className="space-y-6 rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm lg:p-10">
                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                                    {dateFormatter.format(new Date(featuredPost.date))}
                                </p>
                                <h2 className="text-3xl font-semibold text-neutral-900 lg:text-4xl">
                                    {featuredPost.title}
                                </h2>
                                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                                    {t.by} {featuredPost.author}
                                </p>
                            </div>
                            <div className="article-content" dangerouslySetInnerHTML={{ __html: featuredHtml }} />
                            <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-6 text-xs uppercase tracking-[0.25em] text-neutral-500">
                                {featuredPost.tags.map(tag => (
                                    <span key={tag} className="rounded-full border border-neutral-200 px-3 py-1">
                                        {tag}
                                    </span>
                                ))}
                                <Link
                                    href={locale === 'es' ? `/blog/${featuredPost.slug}` : `/${locale}/blog/${featuredPost.slug}`}
                                    className="ml-auto text-neutral-900 hover:underline"
                                >
                                    {t.readMore} &rarr;
                                </Link>
                            </div>
                        </article>

                        <aside className="space-y-6 rounded-3xl border border-neutral-200/90 bg-white/70 p-5 shadow-sm lg:sticky lg:top-24 lg:h-fit">
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{t.archive}</p>
                                <h3 className="text-lg font-semibold text-neutral-900">{t.recentPosts}</h3>
                            </div>
                            <nav className="space-y-4">
                                {posts.map(post => (
                                    <div
                                        key={post.slug}
                                        className="space-y-1 border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
                                    >
                                        <Link
                                            href={locale === 'es' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`}
                                            className="block text-sm font-medium text-neutral-900 hover:underline"
                                        >
                                            {post.title}
                                        </Link>
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                                            {dateFormatter.format(new Date(post.date))}
                                        </p>
                                        <p className="text-xs text-neutral-500">{post.excerpt}</p>
                                    </div>
                                ))}
                            </nav>
                        </aside>
                    </div>
                )}
            </section>
        </div>
    )
}
