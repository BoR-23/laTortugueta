#!/usr/bin/env node
/**
 * Extrae todos los precios definidos en los frontmatters y los vuelca en data/pricing.json.
 * Útil para inicializar el sistema de precios centralizado.
 */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const productsDir = path.resolve(__dirname, '..', 'data', 'products')
const outputPath = path.resolve(__dirname, '..', 'data', 'pricing.json')

if (!fs.existsSync(productsDir)) {
  console.error(`❌ No se encontró el directorio de productos: ${productsDir}`)
  process.exit(1)
}

const pricing = {}
const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.md'))

files.forEach(file => {
  const id = file.replace(/\.md$/, '')
  const content = fs.readFileSync(path.join(productsDir, file), 'utf8')
  const parsed = matter(content)
  const price = typeof parsed.data.price === 'number' ? parsed.data.price : null

  if (price != null) {
    pricing[id] = price
  }
})

fs.writeFileSync(outputPath, JSON.stringify(pricing, null, 2), 'utf8')

console.log(`💾 Archivo de precios generado con ${Object.keys(pricing).length} entradas: ${outputPath}`)
