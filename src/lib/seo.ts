import type { Product } from '@/lib/products'
import type { BlogPost } from '@/lib/blog'
import { getProductImageVariant } from '@/lib/images'
import { INSTAGRAM_URL } from '@/lib/contact'

// --- CAMBIOS CLAVE AQUÍ ---
// 1. Título con keywords principales (se repetirá en todas las pestañas)
const SITE_NAME = 'La Tortugueta · Calcetines Tradicionales'
// 2. Descripción precisa: solo calcetines, nada de trajes completos
const SITE_DESCRIPTION =
  'Taller artesanal de calcetines tradicionales y reproducción de modelos históricos en Alcoi. Especialistas en calcetines bordados para indumentaria valenciana y de fallera.'
const SITE_TAGLINE = 'Calcetines artesanales bordados en Alcoi desde 1989.'
// --------------------------

const SITE_LOCALE = 'es_ES'
const DEFAULT_SOCIAL_PROFILES = [INSTAGRAM_URL.replace(/\/$/, '')]

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const siteMetadata = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  shortDescription: SITE_TAGLINE,
  locale: SITE_LOCALE,
  keywords: [
    'calcetines tradicionales',
    'calcetines valencianos',
    'calcetines de fallera',
    'calcetines fallero',
    'calcetines bordados',
    'indumentaria valenciana',
    'reproducción histórica',
    'La Tortugueta',
    'taller Alcoi'
  ]
}

export const getSiteUrl = () => {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
    'http://localhost:3000'
  ].filter(value => typeof value === 'string' && !/^\*+$/.test(value)) as string[]

  for (const candidate of candidates) {
    try {
      return stripTrailingSlash(new URL(candidate).toString())
    } catch {
      continue
    }
  }

  return 'https://www.latortugueta.com'
}

export const absoluteUrl = (path = '/') => {
  if (!path) {
    return getSiteUrl()
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  if (path.startsWith('//')) {
    return `https:${path}`
  }
  try {
    return new URL(path, getSiteUrl()).toString()
  } catch {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${getSiteUrl()}${normalized}`
  }
}

const toAbsoluteImageUrl = (value?: string) => {
  if (!value) {
    return undefined
  }
  if (/^https?:\/\//i.test(value)) {
    return value
  }
  if (value.startsWith('//')) {
    return `https:${value}`
  }
  return absoluteUrl(value)
}

export const defaultOpenGraphImage = absoluteUrl('/og-image.png')

const resolveProductImage = (image?: string) => {
  if (!image) {
    return undefined
  }
  const variant = getProductImageVariant(image, 'full')
  return toAbsoluteImageUrl(variant || image)
}

export const getPrimaryProductImage = (product: Product) => {
  const gallery = product.gallery?.length ? product.gallery : product.image ? [product.image] : []
  const primary = gallery[0]
  return resolveProductImage(primary) ?? defaultOpenGraphImage
}

export const buildOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'La Tortugueta', // Dejamos la marca limpia aquí
  url: getSiteUrl(),
  logo: absoluteUrl('/icon.png'),
  image: absoluteUrl('/og-image.png'),
  sameAs: DEFAULT_SOCIAL_PROFILES
})

export const buildWebsiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: getSiteUrl()
})

export const buildCatalogJsonLd = (totalItems: number) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Catálogo de Calcetines · ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  url: absoluteUrl('/'),
  numberOfItems: totalItems
})

export const buildProductBreadcrumbJsonLd = (product: Product) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Inicio',
      item: absoluteUrl('/')
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: product.category ?? 'Catálogo',
      item: absoluteUrl(`/?category=${encodeURIComponent(product.category ?? 'catalogo')}`)
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: absoluteUrl(`/${product.id}`)
    }
  ]
})

export const buildProductJsonLd = (product: Product) => {
  const gallery = product.gallery?.length ? product.gallery : product.image ? [product.image] : []
  const images = gallery
    .map(entry => resolveProductImage(entry))
    .filter(Boolean) as string[]

  if (images.length === 0) {
    images.push(defaultOpenGraphImage)
  }

  // Generar descripción optimizada para el Schema si falta
  const schemaDescription = product.description ||
    `Calcetines tradicionales ${product.name}. Calcetines bordados ideales para indumentaria valenciana y de fallera.`

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: schemaDescription,
    image: images,
    sku: product.id,
    category: product.category ?? undefined,
    color: product.color || undefined,
    material: product.material || undefined,
    brand: {
      '@type': 'Brand',
      name: 'La Tortugueta'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: Number(product.price ?? 0).toFixed(2),
      availability:
        product.available === false
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/InStock',
      url: absoluteUrl(`/${product.id}`)
    }
  }
}

export const buildBlogListingJsonLd = (posts: BlogPost[]) => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: `${SITE_NAME} · Blog`,
  url: absoluteUrl('/blog'),
  blogPost: posts.slice(0, 12).map(post => ({
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    url: absoluteUrl(`/blog/${post.slug}`),
    author: {
      '@type': 'Person',
      name: post.author
    }
  }))
})

export const buildArticleJsonLd = (post: BlogPost) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  datePublished: post.date,
  dateModified: post.date,
  description: post.excerpt || SITE_DESCRIPTION,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': absoluteUrl(`/blog/${post.slug}`)
  },
  author: {
    '@type': 'Person',
    name: post.author
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/favicon.svg')
    }
  },
  image: defaultOpenGraphImage
})
