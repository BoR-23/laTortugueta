const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'public', 'images', 'products')
const variantsRootDir = path.join(sourceDir, '_variants')

const VARIANT_SPECS = [
  { name: 'thumb', width: 360, quality: 78 },
  { name: 'medium', width: 960, quality: 82 },
  { name: 'full', width: 1500, quality: 86 }
]

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

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

const main = async () => {
  if (!fs.existsSync(sourceDir)) {
    console.error('Source dir not found:', sourceDir)
    return
  }

  console.log('Creating variant directories...')
  fs.mkdirSync(variantsRootDir, { recursive: true })
  VARIANT_SPECS.forEach(spec =>
    fs.mkdirSync(path.join(variantsRootDir, spec.name), { recursive: true })
  )

  const files = fs.readdirSync(sourceDir).filter(file => {
    const ext = path.extname(file).toLowerCase()
    return SUPPORTED_EXTENSIONS.has(ext) && !file.startsWith('_')
  })

  console.log(`Found ${files.length} images to process`)
  
  let processed = 0
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file)
    try {
      await generateResponsiveVariants(sourcePath, file)
      processed++
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${files.length} images...`)
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message)
    }
  }

  console.log(`Done! Generated variants for ${processed} images`)
}

main().catch(console.error)
