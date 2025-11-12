import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { renderMarkdown } from '@/lib/markdown'

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'long'
})

export const metadata = {
  title: 'Blog - La Tortugueta',
  description: 'Relats i referencies de la calceteria tradicional documentats per La Tortugueta.'
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts()
  const featuredPost = posts[0]
  const featuredHtml = featuredPost ? renderMarkdown(featuredPost.content) : ''

  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Relats i memoria</p>
          <h1 className="text-4xl font-semibold text-neutral-900 sm:text-5xl">
            Blog de calceteria tradicional
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
            Histories, tecniques i arxius personals de Macu Garcia i del taller familiar. Documents
            perque qualsevol persona entenga que hi ha darrere de cada parell de mitges.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-sm leading-relaxed text-neutral-600">
            Encara no hi ha entrades publicades. Afegeix arxius a `data/blog` per comencar l&apos;arxiu
            viu.
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
                  Per {featuredPost.author}
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
                  href={`/blog/${featuredPost.slug}`}
                  className="ml-auto text-neutral-900 hover:underline"
                >
                  Llegir article complet &rarr;
                </Link>
              </div>
            </article>

            <aside className="space-y-6 rounded-3xl border border-neutral-200/90 bg-white/70 p-5 shadow-sm lg:sticky lg:top-24 lg:h-fit">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Arxiu</p>
                <h3 className="text-lg font-semibold text-neutral-900">Entrades recents</h3>
              </div>
              <nav className="space-y-4">
                {posts.map(post => (
                  <div
                    key={post.slug}
                    className="space-y-1 border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
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
