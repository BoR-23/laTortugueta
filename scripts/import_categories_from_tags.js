#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const PRODUCTS_DIR = path.join(process.cwd(), 'data', 'products')
const CATEGORIES_FILE = path.join(process.cwd(), 'data', 'categories.json')

const headerLimit = Number(process.argv[2]) || 8

const slugify = value =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const readProductTags = () => {
  const files = fs.readdirSync(PRODUCTS_DIR).filter(file => file.endsWith('.md'))
  const counts = new Map()
  files.forEach(file => {
    const filePath = path.join(PRODUCTS_DIR, file)
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = matter(raw)
    const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags : []
    tags.forEach(tag => {
      if (typeof tag !== 'string') return
      const label = tag.trim()
      if (!label) return
      counts.set(label, (counts.get(label) || 0) + 1)
    })
  })
  return [...counts.entries()]
    .sort((a, b) => {
      const diff = b[1] - a[1]
      return diff !== 0 ? diff : a[0].localeCompare(b[0], 'es')
    })
    .map(entry => entry[0])
}

const buildCategories = tags => {
  const categories = []

  categories.push({
    id: 'header-archive',
    scope: 'header',
    name: 'Archivo completo',
    tagKey: null,
    parentId: null,
    order: 0
  })

  tags.slice(0, headerLimit).forEach((tag, index) => {
    categories.push({
      id: `header-${slugify(tag) || 'tag'}-${index}`,
      scope: 'header',
      name: tag,
      tagKey: tag,
      parentId: null,
      order: index + 1
    })
  })

  tags.forEach((tag, index) => {
    categories.push({
      id: `filter-${slugify(tag) || 'tag'}-${index}`,
      scope: 'filter',
      name: tag,
      tagKey: tag,
      parentId: null,
      order: index
    })
  })

  return categories
}

const writeCategories = categories => {
  const json = JSON.stringify(categories, null, 2)
  const encoding = new TextEncoder()
  fs.writeFileSync(CATEGORIES_FILE, Buffer.from(encoding.encode(json)))
}

const main = () => {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.error(`No se encontró el directorio de productos en ${PRODUCTS_DIR}`)
    process.exit(1)
  }
  const tags = readProductTags()
  if (!tags.length) {
    console.warn('No se encontraron tags en los productos. No se generaron categorías.')
    process.exit(0)
  }
  const categories = buildCategories(tags)
  writeCategories(categories)
  console.log(
    `Importación completada: ${categories.filter(cat => cat.scope === 'header').length} categorías de header y ${categories.filter(cat => cat.scope === 'filter').length} de filtros`
  )
}

main()
