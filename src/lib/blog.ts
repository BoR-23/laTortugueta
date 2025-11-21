import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { createSupabaseServerClient } from './supabaseClient'
import { Locale } from '@/i18n/dictionaries'

export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  author: string
  content: string
  tags: string[]
  locale: Locale
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

const buildMarkdownPost = (fileName: string, fileContents: string, locale: Locale): BlogPost => {
  const { data, content } = matter(fileContents)
  // Remove locale extension for slug (e.g. my-post.en.md -> my-post)
  const inferredSlug = fileName.replace(/\.(en|ca|es)?\.mdx?$/, '')

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
    content: content.trim(),
    locale
  }
}

const getMarkdownPosts = (locale: Locale = 'es'): BlogPost[] => {
  if (!fs.existsSync(blogDirectory)) {
    return []
  }

  const files = fs
    .readdirSync(blogDirectory)
    .filter(file => {
      // Match files that end with .{locale}.md or just .md
      if (locale === 'es') {
        // For Spanish, we accept .es.md OR .md (legacy/default)
        // But we must exclude other locales
        return (file.endsWith('.es.md') || file.endsWith('.md') || file.endsWith('.mdx')) && !file.endsWith('.en.md') && !file.endsWith('.ca.md')
      }
      return file.endsWith(`.${locale}.md`) || file.endsWith(`.${locale}.mdx`)
    })

  const posts = files.map(fileName => {
    const filePath = path.join(blogDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    return buildMarkdownPost(fileName, fileContents, locale)
  })

  return posts.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf())
}

export const getAllPosts = async (locale: Locale = 'es'): Promise<BlogPost[]> => {
  // Por ahora usar solo archivos markdown locales
  return getMarkdownPosts(locale)
}

export const getPostBySlug = async (slug: string, locale: Locale = 'es'): Promise<BlogPost | null> => {
  const posts = await getAllPosts(locale)
  return posts.find(post => post.slug === slug) ?? null
}

export const getRecentPosts = async (limit = 3, locale: Locale = 'es'): Promise<BlogPost[]> => {
  const posts = await getAllPosts(locale)
  return posts.slice(0, limit)
}
