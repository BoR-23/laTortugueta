import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { createSupabaseServerClient } from './supabaseClient'

export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  author: string
  content: string
  tags: string[]
}

const blogDirectory = path.join(process.cwd(), 'data', 'blog')
const supabaseBlogAvailable =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

const normaliseSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const buildMarkdownPost = (fileName: string, fileContents: string): BlogPost => {
  const { data, content } = matter(fileContents)
  const inferredSlug = fileName.replace(/\.mdx?$/, '')
  const slug =
    typeof data.slug === 'string' && data.slug.trim().length > 0
      ? normaliseSlug(data.slug)
      : normaliseSlug(inferredSlug)

  return {
    slug,
    title: typeof data.title === 'string' ? data.title : slug,
    date: typeof data.date === 'string' ? data.date : new Date().toISOString(),
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    author: typeof data.author === 'string' ? data.author : 'Equipo La Tortugueta',
    tags: Array.isArray(data.tags) ? data.tags.map(tag => String(tag)) : [],
    content: content.trim()
  }
}

const getMarkdownPosts = (): BlogPost[] => {
  if (!fs.existsSync(blogDirectory)) {
    return []
  }

  const files = fs
    .readdirSync(blogDirectory)
    .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))

  const posts = files.map(fileName => {
    const filePath = path.join(blogDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    return buildMarkdownPost(fileName, fileContents)
  })

  return posts.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf())
}

const mapSupabasePost = (record: any): BlogPost => ({
  slug: record.slug,
  title: record.title,
  date: record.published_at ?? record.created_at ?? new Date().toISOString(),
  excerpt: record.excerpt ?? '',
  author: record.author ?? 'Equipo La Tortugueta',
  tags: Array.isArray(record.tags) ? record.tags.map((tag: unknown) => String(tag)) : [],
  content: record.content ?? ''
})

const getSupabasePosts = async (): Promise<BlogPost[]> => {
  const client = createSupabaseServerClient()
  const { data, error } = await client
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false })

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudieron leer las entradas del blog.')
  }

  return data.map(mapSupabasePost)
}

export const getAllPosts = async (): Promise<BlogPost[]> => {
  if (supabaseBlogAvailable) {
    return await getSupabasePosts()
  }

  return getMarkdownPosts()
}

export const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const posts = await getAllPosts()
  return posts.find(post => post.slug === slug) ?? null
}

export const getRecentPosts = async (limit = 3): Promise<BlogPost[]> => {
  const posts = await getAllPosts()
  return posts.slice(0, limit)
}
