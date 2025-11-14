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
// Temporalmente deshabilitado para evitar errores de build
const supabaseBlogAvailable = false

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

export const getAllPosts = async (): Promise<BlogPost[]> => {
  // Por ahora usar solo archivos markdown locales
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
