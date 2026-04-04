import type { Product } from '@/lib/products'

export type ProductEditorialStory = {
  title: string
  body: string
  bodyVa?: string
  origin?: string
  cost?: string
  metaDescription?: string
  images: string[]
}

const readTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const extractProductStory = (product: Product): ProductEditorialStory | null => {
  const metadata = product.metadata ?? {}
  const title = readTrimmedString(metadata.storyTitle)
  const body = readTrimmedString(metadata.storyBody)
  const bodyVa = readTrimmedString(metadata.storyBodyVa)
  const origin = readTrimmedString(metadata.storyOrigin)
  const cost = readTrimmedString(metadata.storyCost)
  const metaDescription = readTrimmedString(metadata.storyMetaDescription)
  const imagesRaw = metadata.storyImages

  let images: string[] = []
  if (Array.isArray(imagesRaw)) {
    images = imagesRaw.map(value => String(value ?? '').trim()).filter(Boolean)
  } else if (typeof imagesRaw === 'string') {
    images = imagesRaw
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  }

  if (!title && !body && !bodyVa && !origin && !cost && !metaDescription && images.length === 0) {
    return null
  }

  return {
    title: title || product.name,
    body,
    bodyVa: bodyVa || undefined,
    origin: origin || undefined,
    cost: cost || undefined,
    metaDescription: metaDescription || undefined,
    images
  }
}

export const buildProductMetaDescription = (product: Product) => {
  const story = extractProductStory(product)

  if (story?.metaDescription) {
    return story.metaDescription.slice(0, 160)
  }

  const baseDescription = (product.description || '').trim()
  if (baseDescription.length >= 60) {
    return baseDescription.slice(0, 160)
  }

  const storyBody = story?.body?.replace(/\s+/g, ' ').trim()
  if (storyBody && storyBody.length >= 60) {
    return storyBody.slice(0, 160)
  }

  return `Calcetines tradicionales valencianos modelo ${product.name}. Reproducción artesanal${product.color ? ` en color ${product.color}` : ''}. Perfectos para indumentaria tradicional y bailes regionales. Confección en Alcoi de alta calidad.`.slice(0, 160)
}
