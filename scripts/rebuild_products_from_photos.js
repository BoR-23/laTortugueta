#!/usr/bin/env node
/**
 * Regenera los archivos MD de productos desde la biblioteca fotosFinales/fotos_Finales.
 * Crea un producto por carpeta, con datos base mÃ­nimos.
 */
const fs = require('fs')
const path = require('path')
const { findPhotoLibraryRoot, listPhotoLibraryCandidates } = require('./utils/photoLibrary')

const projectRoot = path.resolve(__dirname, '..')
const productsDir = path.join(projectRoot, 'data', 'products')
const photosRoot = findPhotoLibraryRoot(projectRoot, {
  extraCandidates: [
    path.resolve(projectRoot, '..', 'fotos_organizadas'),
    path.resolve(projectRoot, '..', 'laTortugueta', 'fotos_organizadas'),
    path.resolve(projectRoot, '..', '..', 'laTortugueta', 'fotos_organizadas')
  ]
})

if (!photosRoot) {
  console.error('[!] No se encontró la carpeta de fotos finales. Rutas comprobadas:')
  listPhotoLibraryCandidates(projectRoot).forEach(candidate => console.error(`   - ${candidate}`))
  process.exit(1)
}

fs.mkdirSync(productsDir, { recursive: true })

const slugify = value =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const humanize = value =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const defaultFrontmatter = name => ({
  name,
  color: 'Multicolor',
  type: 'Calcetines artesanales',
  price: 0,
  image: '',
  description: `Modelo ${name} perteneciente a la colecciÃ³n de calceterÃ­a tradicional.`,
  tags: [],
  material: 'AlgodÃ³n artesanal',
  care: 'Lavar a mano con agua frÃ­a, no usar secadora',
  origin: 'Tejidos artesanalmente en EspaÃ±a'
})

const stringifyFrontmatter = (data, content) => {
  const lines = ['---']
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      value.forEach(item => lines.push(`  - ${item}`))
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${JSON.stringify(value)}`)
    } else {
      lines.push(`${key}: ${value}`)
    }
  }
  lines.push('---', '', content.trim(), '')
  return lines.join('\n')
}

// Vaciar directorio actual
const existing = fs.readdirSync(productsDir).filter(file => file.endsWith('.md'))
existing.forEach(file => fs.unlinkSync(path.join(productsDir, file)))

const entries = fs
  .readdirSync(photosRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name, 'es'))

let created = 0

for (const entry of entries) {
  const slug = slugify(entry.name)
  if (!slug) {
    continue
  }

  const name = humanize(entry.name)
  const frontmatter = defaultFrontmatter(name)
  const mdContent = stringifyFrontmatter(frontmatter, `Calcetines artesanales modelo ${name}.`)

  const targetPath = path.join(productsDir, `${slug}.md`)
  fs.writeFileSync(targetPath, mdContent, 'utf8')
  created += 1
}

console.log(`ðŸ†• Generados ${created} productos a partir de ${photosRoot}`)

