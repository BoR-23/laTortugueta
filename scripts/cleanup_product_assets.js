#!/usr/bin/env node

/**
 * Detects (and optionally elimina) imágenes huérfanas dentro de `assets/product-images`.
 * - Busca archivos cuyo slug no exista en `data/products/*.md`
 * - Soporta modo `--delete` para eliminarlos físicamente
 */

const fs = require('fs')
const path = require('path')

const matter = require('gray-matter')

const args = process.argv.slice(2)
const shouldDelete = args.includes('--delete')
const projectRoot = path.resolve(__dirname, '..')
const assetsRoot = path.resolve(projectRoot, '..', 'assets', 'product-images')
const variantsRoot = path.join(assetsRoot, '_variants')
const productsDir = path.join(projectRoot, 'data', 'products')

const asRelative = target => path.relative(projectRoot, target).replace(/\\/g, '/')

const getProductSlugs = () => {
  if (!fs.existsSync(productsDir)) {
    return new Set()
  }
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.md'))
  const slugs = new Set()
  for (const file of files) {
    const filePath = path.join(productsDir, file)
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = matter(raw)
      const frontmatterSlug = typeof parsed.data.id === 'string' ? parsed.data.id.trim() : null
      const slug = frontmatterSlug && frontmatterSlug.length > 0 ? frontmatterSlug : file.replace(/\.md$/, '')
      slugs.add(slug)
    } catch (error) {
      console.warn(`[cleanup] No se pudo leer ${file}:`, error.message)
    }
  }
  return slugs
}

const collectAssetFiles = dir => {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(dir, entry.name))
}

const extractSlug = filePath => {
  const base = path.basename(filePath)
  const match = base.match(/^(.+?)_(\d+)\.(jpe?g|png|webp)$/i)
  return match ? match[1] : null
}

const analyseFolder = (folderPath, validSlugs) => {
  const files = collectAssetFiles(folderPath)
  const orphans = []
  for (const file of files) {
    const slug = extractSlug(file)
    if (!slug || !validSlugs.has(slug)) {
      orphans.push(file)
    }
  }
  return orphans
}

const deleteFiles = files => {
  files.forEach(file => {
    try {
      fs.rmSync(file, { force: true })
      console.log(`[cleanup] Eliminado: ${asRelative(file)}`)
    } catch (error) {
      console.error(`[cleanup] Error al eliminar ${asRelative(file)}:`, error.message)
    }
  })
}

const run = () => {
  const validSlugs = getProductSlugs()
  if (validSlugs.size === 0) {
    console.warn('[cleanup] No se detectaron productos. ¿Ejecutaste este script dentro de catalog/?')
  }

  const folders = [assetsRoot]
  if (fs.existsSync(variantsRoot)) {
    for (const variant of fs.readdirSync(variantsRoot, { withFileTypes: true })) {
      if (variant.isDirectory()) {
        folders.push(path.join(variantsRoot, variant.name))
      }
    }
  }

  const orphans = []
  folders.forEach(folder => {
    const folderOrphans = analyseFolder(folder, validSlugs)
    if (folderOrphans.length > 0) {
      console.log(`\n[cleanup] ${folderOrphans.length} archivos huérfanos en ${asRelative(folder)}:`)
      folderOrphans.forEach(file => console.log(` · ${path.basename(file)}`))
      orphans.push(...folderOrphans)
    } else {
      console.log(`[cleanup] ${asRelative(folder)} sin huérfanos.`)
    }
  })

  if (orphans.length === 0) {
    console.log('\n[cleanup] No se encontraron archivos huérfanos.')
    return
  }

  if (shouldDelete) {
    console.log(`\n[cleanup] Eliminando ${orphans.length} archivos...`)
    deleteFiles(orphans)
  } else {
    console.log(
      '\n[cleanup] Ejecuta este script con "--delete" para eliminar los archivos listados. Por defecto solo se reportan.'
    )
  }
}

run()
