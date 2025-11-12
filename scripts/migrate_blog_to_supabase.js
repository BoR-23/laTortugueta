#!/usr/bin/env node

/**
 * Migra las entradas Markdown de `data/blog` a la tabla `blog_posts` de Supabase.
 * Uso: npm run blog:migrate
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const blogDir = path.resolve(__dirname, '..', 'data', 'blog')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error(
    '[blog:migrate] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

const normaliseSlug = value =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const readMarkdownPosts = () => {
  if (!fs.existsSync(blogDir)) {
    console.warn('[blog:migrate] No existe data/blog. Nada que migrar.')
    return []
  }

  const files = fs
    .readdirSync(blogDir)
    .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))

  return files.map(fileName => {
    const filePath = path.join(blogDir, fileName)
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(raw)
    const slugSource =
      typeof data.slug === 'string' && data.slug.trim().length > 0
        ? data.slug
        : fileName.replace(/\.mdx?$/, '')
    return {
      slug: normaliseSlug(slugSource),
      title: data.title || slugSource,
      excerpt: data.excerpt || '',
      author: data.author || 'Equipo La Tortugueta',
      tags: Array.isArray(data.tags) ? data.tags.map(tag => String(tag)) : [],
      published_at:
        typeof data.date === 'string' && !Number.isNaN(Date.parse(data.date))
          ? new Date(data.date).toISOString()
          : new Date().toISOString(),
      content: content.trim()
    }
  })
}

const main = async () => {
  const posts = readMarkdownPosts()
  if (posts.length === 0) {
    console.log('[blog:migrate] No se detectaron posts para migrar.')
    return
  }

  console.log(`[blog:migrate] Migrando ${posts.length} entradas…`)
  const { error } = await supabase.from('blog_posts').upsert(posts, {
    onConflict: 'slug'
  })

  if (error) {
    console.error('[blog:migrate] Error al insertar:', error.message)
    process.exit(1)
  }

  console.log('[blog:migrate] Migración completada.')
}

main()
