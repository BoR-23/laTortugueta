/**
 * Sync product markdown metadata with the organized photo library.
 * - Copies photos from the new fotosFinales repository into public/images/products
 * - Renames images using the product slug with incremental suffixes
 * - Extrae etiquetas del EXIF (colecciones y cÃ³digos de color) y actualiza frontmatter
 */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const exifr = require('exifr')
const sharp = require('sharp')
const { findPhotoLibraryRoot, listPhotoLibraryCandidates } = require('./utils/photoLibrary')

const projectRoot = path.resolve(__dirname, '..')
const productsDir = path.join(projectRoot, 'data', 'products')
const targetDir = path.resolve(projectRoot, '..', 'assets', 'product-images')
const variantsRootDir = path.join(targetDir, '_variants')

const VARIANT_SPECS = [
  { name: 'thumb', width: 360, quality: 78 },
  { name: 'medium', width: 960, quality: 82 },
  { name: 'full', width: 1500, quality: 86 }
]

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const sourceRoot = findPhotoLibraryRoot(projectRoot, {
  extraCandidates: [
    path.resolve(projectRoot, '..', 'fotos_organizadas'),
    path.resolve(projectRoot, '..', 'laTortugueta', 'fotos_organizadas'),
    path.resolve(projectRoot, '..', '..', 'laTortugueta', 'fotos_organizadas')
  ]
})

if (!sourceRoot) {
  console.error('[!] Fuente de fotos no encontrada. Revisa estas rutas:')
  listPhotoLibraryCandidates(projectRoot).forEach(candidate => console.error(`   - ${candidate}`))
  process.exit(1)
}

if (!fs.existsSync(productsDir)) {
  console.error(`[!] Directorio de productos no encontrado: ${productsDir}`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })
fs.mkdirSync(variantsRootDir, { recursive: true })
VARIANT_SPECS.forEach(spec =>
  fs.mkdirSync(path.join(variantsRootDir, spec.name), { recursive: true })
)

const applyFormatOptions = (instance, extension, quality) => {
  if (extension === '.png') {
    return instance.png({ compressionLevel: 8, adaptiveFiltering: true })
  }
  if (extension === '.webp') {
    return instance.webp({ quality })
  }
  return instance.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
}

const generateResponsiveVariants = async (sourcePath, fileName) => {
  const extension = path.extname(fileName).toLowerCase()
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return
  }

  await Promise.all(
    VARIANT_SPECS.map(async spec => {
      const outputPath = path.join(variantsRootDir, spec.name, fileName)
      const pipeline = sharp(sourcePath)
        .rotate()
        .resize({
          width: spec.width,
          fit: 'inside',
          withoutEnlargement: true
        })

      applyFormatOptions(pipeline, extension, spec.quality)
      await pipeline.toFile(outputPath)
    })
  )
}

const removeExistingProductAssets = slug => {
  const prefix = `${slug}_`

  fs.readdirSync(targetDir)
    .filter(entry => entry.startsWith(prefix))
    .forEach(entry => fs.unlinkSync(path.join(targetDir, entry)))

  VARIANT_SPECS.forEach(spec => {
    const variantDir = path.join(variantsRootDir, spec.name)
    if (!fs.existsSync(variantDir)) {
      return
    }
    fs.readdirSync(variantDir)
      .filter(entry => entry.startsWith(prefix))
      .forEach(entry => fs.unlinkSync(path.join(variantDir, entry)))
  })
}

const normalizeKey = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()

const toTitleCase = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const naturalSort = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

const availableDirectories = (() => {
  const entries = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())

  const map = new Map()
  for (const entry of entries) {
    const key = normalizeKey(entry.name)
    if (!map.has(key)) {
      map.set(key, path.join(sourceRoot, entry.name))
    }
  }
  return map
})()

const extractTagsFromDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return { category: null, tags: [] }
  }

  const parts = description.split('|').map(part => part.trim()).filter(Boolean)
  if (parts.length === 0) {
    return { category: null, tags: [] }
  }

  const tagSet = new Set()
  let categoryFromExif = null

  const first = parts.shift()
  const folderMatch = first && first.match(/Original folder:\s*(.+)/i)
  if (folderMatch) {
    const folderPath = folderMatch[1].trim()
    const segments = folderPath.split('/').map(segment => segment.trim()).filter(Boolean)
    const filteredSegments = segments.filter(segment => segment.toLowerCase() !== 'fotos')

    if (filteredSegments.length > 0) {
      categoryFromExif = toTitleCase(filteredSegments[filteredSegments.length - 1])
    }

    filteredSegments.forEach(segment => {
      const normalised = toTitleCase(segment)
      if (normalised) {
        tagSet.add(normalised)
      }
    })
  } else if (first) {
    tagSet.add(toTitleCase(first))
  }

  parts.forEach(part => {
    if (!part) return
    if (/^#\d{3}$/.test(part)) {
      tagSet.add(`Color ${part.slice(1)}`)
    } else {
      const cleaned = part.replace(/^#/, '').trim()
      if (cleaned) {
        tagSet.add(toTitleCase(cleaned))
      }
    }
  })

  return {
    category: categoryFromExif,
    tags: Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'es'))
  }
}

const extractExifTags = async (designDir, imageFiles) => {
  if (!imageFiles.length) {
    return { category: null, tags: [] }
  }

  const samplePath = path.join(designDir, imageFiles[0])

  try {
    const data = await exifr.parse(samplePath, ['ImageDescription'])
    return extractTagsFromDescription(data?.ImageDescription)
  } catch (error) {
    return { category: null, tags: [] }
  }
}

const findDesignDirectory = (productName, slug) => {
  const candidates = new Set()
  if (productName) {
    candidates.add(normalizeKey(productName))
  }
  if (slug) {
    candidates.add(normalizeKey(slug.replace(/-/g, ' ')))
  }

  for (const candidate of candidates) {
    if (availableDirectories.has(candidate)) {
      return availableDirectories.get(candidate)
    }
  }

  return null
}

const syncProduct = async (fileName) => {
  const slug = fileName.replace(/\.md$/, '')
  const filePath = path.join(productsDir, fileName)

  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  const data = parsed.data || {}

  const productName = data.name

  if (!productName) {
    console.warn(`âš ï¸  Saltando ${fileName}: falta el campo 'name'`)
    return null
  }

  const designDir = findDesignDirectory(productName, slug)
  if (!designDir) {
    console.warn(`âš ï¸  No se encontrÃ³ carpeta de imÃ¡genes para "${productName}" (${fileName})`)
    return null
  }

  const imageFiles = fs
    .readdirSync(designDir)
    .filter(entry => /\.(jpe?g|png|webp)$/i.test(entry))
    .sort(naturalSort)

  if (imageFiles.length === 0) {
    console.warn(`âš ï¸  Sin imÃ¡genes para "${productName}" (${fileName})`)
    return null
  }

  removeExistingProductAssets(slug)

  const copied = []

  for (const [index, imageName] of imageFiles.entries()) {
    const ext = path.extname(imageName).toLowerCase()
    const destName = `${slug}_${String(index + 1).padStart(3, '0')}${ext}`
    const sourcePath = path.join(designDir, imageName)
    const destPath = path.join(targetDir, destName)

    fs.copyFileSync(sourcePath, destPath)
    await generateResponsiveVariants(destPath, destName)
    copied.push(`/images/products/${destName}`)
  }

  const { category: categoryFromExif, tags: exifTags } = await extractExifTags(designDir, imageFiles)

  const existingTags = Array.isArray(data.tags) ? data.tags : []
  const mergedTags = Array.from(
    new Set(
      [...existingTags, ...exifTags]
        .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'es'))

  const updatedData = {
    ...data,
    image: copied[0],
    photos: copied.length,
    tags: mergedTags.length > 0 ? mergedTags : existingTags
  }

  if (categoryFromExif) {
    updatedData.category = categoryFromExif
  }

  const updated = matter.stringify(parsed.content.trimEnd() + '\n', updatedData)
  fs.writeFileSync(filePath, updated, 'utf8')

  return {
    slug,
    photos: copied.length,
    primaryImage: copied[0]
  }
}

const main = async () => {
  const productFiles = fs
    .readdirSync(productsDir)
    .filter(file => file.endsWith('.md'))
    .sort()

  const summary = []

  for (const fileName of productFiles) {
    const result = await syncProduct(fileName)
    if (result) {
      summary.push(result)
    }
  }

  console.log(`âœ… Sincronizados ${summary.length} productos`)
}

main().catch(error => {
  console.error('âŒ Error durante la sincronizaciÃ³n:', error)
  process.exit(1)
})
