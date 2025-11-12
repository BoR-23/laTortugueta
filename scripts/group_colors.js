const fs = require('fs')
const path = require('path')

const file = path.join('data', 'categories.json')
const text = fs.readFileSync(file, 'utf8')
const categories = JSON.parse(text)
const colorRegex = /^Color\s+(1\d\d)$/i

const filterColors = categories.filter(cat => cat.scope === 'filter' && colorRegex.test(cat.name))

if (!filterColors.length) {
  console.log('No filter color categories found')
  process.exit(0)
}

const parentId = 'filter-colors-group'
let parent = categories.find(cat => cat.id === parentId)
const minOrder = Math.min(...filterColors.map(cat => cat.order))

if (!parent) {
  parent = {
    id: parentId,
    scope: 'filter',
    name: 'Colores',
    tagKey: null,
    parentId: null,
    order: minOrder
  }
  categories.push(parent)
}

filterColors.forEach(cat => {
  const match = cat.name.match(colorRegex)
  const num = match ? parseInt(match[1], 10) : 0
  cat.parentId = parentId
  cat.order = num
})

fs.writeFileSync(file, JSON.stringify(categories, null, 2), 'utf8')
console.log(`Agrupadas ${filterColors.length} categorías bajo "Colores"`)
