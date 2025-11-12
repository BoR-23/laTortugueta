#!/usr/bin/env node
/**
 * Quick diagnostics for the photo → markdown → public assets pipeline.
 * Verifies that:
 *  - The original photo library is reachable
 *  - Each markdown product has at least one copied gallery image
 *  - Every photo directory has a corresponding product file
 *  - There are no orphaned public images
 */
const fs = require('fs')
const path = require('path')
const { findPhotoLibraryRoot, listPhotoLibraryCandidates } = require('./utils/photoLibrary')

const projectRoot = path.resolve(__dirname, '..')
const productsDir = path.join(projectRoot, 'data', 'products')
const publicImagesDir = path.join(projectRoot, 'public', 'images', 'products')

const normalizeKey = value =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()

const slugToKey = slug => normalizeKey(slug.replace(/-/g, ' '))

const ensureDir = directory => {
  if (!fs.existsSync(directory)) {
    console.error(`[!] Directorio no encontrado: ${directory}`)
    process.exit(1)
  }
}

const photoRoot = findPhotoLibraryRoot(projectRoot, {
  extraCandidates: [
    path.resolve(projectRoot, '..', 'fotos_organizadas'),
    path.resolve(projectRoot, '..', 'laTortugueta', 'fotos_organizadas'),
    path.resolve(projectRoot, '..', '..', 'laTortugueta', 'fotos_organizadas')
  ]
})

if (!photoRoot) {
  console.error('[!] No se encontró la biblioteca original de fotos.')
  listPhotoLibraryCandidates(projectRoot).forEach(candidate => console.error(`   - ${candidate}`))
  process.exit(1)
}

ensureDir(productsDir)
ensureDir(publicImagesDir)

const designEntries = fs
  .readdirSync(photoRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())

const designMap = new Map()
let totalOriginalPhotos = 0

designEntries.forEach(entry => {
  const dirPath = path.join(photoRoot, entry.name)
  const imageCount = fs
    .readdirSync(dirPath)
    .filter(file => /\.(jpe?g|png|webp)$/i.test(file)).length
  totalOriginalPhotos += imageCount
  designMap.set(normalizeKey(entry.name), {
    name: entry.name,
    path: dirPath,
    images: imageCount
  })
})

const productFiles = fs
  .readdirSync(productsDir)
  .filter(file => file.endsWith('.md'))
  .sort()

const galleryFiles = fs
  .readdirSync(publicImagesDir)
  .filter(file => /\.(jpe?g|png|webp)$/i.test(file))

const galleryMap = new Map()
galleryFiles.forEach(file => {
  const match = file.match(/^(.+?)_/)
  if (!match) {
    return
  }
  const slug = match[1]
  if (!galleryMap.has(slug)) {
    galleryMap.set(slug, [])
  }
  galleryMap.get(slug).push(file)
})

const productsMissingGallery = []
const productsMissingSource = []
const productsWithoutSourcePhotos = []
const productKeySet = new Set()

productFiles.forEach(file => {
  const slug = file.replace(/\.md$/, '')
  const key = slugToKey(slug)
  productKeySet.add(key)

  const sourceInfo = designMap.get(key)
  const hasSourcePhotos = sourceInfo ? sourceInfo.images > 0 : false

  if (!galleryMap.has(slug)) {
    if (hasSourcePhotos) {
      productsMissingGallery.push(slug)
    } else {
      productsWithoutSourcePhotos.push(slug)
    }
  }

  if (!sourceInfo) {
    productsMissingSource.push(slug)
  }
})

const orphanDirectories = []
designMap.forEach((value, key) => {
  if (!productKeySet.has(key)) {
    orphanDirectories.push(value.name)
  }
})

const orphanGalleries = []
galleryMap.forEach((files, slug) => {
  const key = slugToKey(slug)
  if (!productKeySet.has(key)) {
    orphanGalleries.push(`${slug} (${files.length} fotos)`)
  }
})

console.log('--- Diagnóstico de datos ---')
console.log(`Biblioteca original: ${photoRoot}`)
console.log(`Diseños detectados en fotos: ${designEntries.length}`)
console.log(`Fotos originales contabilizadas: ${totalOriginalPhotos}`)
console.log(`Productos (.md) disponibles: ${productFiles.length}`)
console.log(`Galerías en public/: ${galleryFiles.length}`)

const warn = (title, items) => {
  if (items.length === 0) {
    return
  }
  console.warn(`\n[!] ${title}: ${items.length}`)
  items.slice(0, 10).forEach(item => console.warn(`   - ${item}`))
  if (items.length > 10) {
    console.warn(`   ... (${items.length - 10} más)`)
  }
}

warn('Productos sin galería copiada', productsMissingGallery)
warn('Productos sin carpeta de origen', productsMissingSource)
warn('Productos sin fotos en la carpeta original', productsWithoutSourcePhotos)
warn('Carpetas de origen sin producto', orphanDirectories)
warn('Galerías en public/ sin producto relacionado', orphanGalleries)

const hasBlockingIssues =
  productsMissingGallery.length > 0 ||
  productsMissingSource.length > 0

if (hasBlockingIssues) {
  console.error('\n[!] Hay incidencias que debes resolver antes de publicar.')
  process.exit(1)
}

console.log('\nTodo listo. Datos coherentes para continuar.')
