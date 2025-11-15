import { describe, expect, it } from 'vitest'

import type { Product } from '@/lib/products'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'
import { prepareCatalogProducts } from '../prepareCatalogProducts'

const buildProduct = (overrides: Partial<Product> = {}): Product => ({
  id: overrides.id ?? 'sock-001',
  name: overrides.name ?? 'Calcetin de prueba',
  color: overrides.color ?? 'rojo',
  type: overrides.type ?? 'calcetin',
  image: overrides.image ?? '/images/products/sock-001.jpg',
  price: overrides.price ?? 25,
  tags: overrides.tags ?? ['rojo'],
  category: overrides.category ?? 'calcetin',
  description: overrides.description ?? 'Descripcion',
  sizes: overrides.sizes ?? ['38-40'],
  photos: overrides.photos ?? 2,
  priority: overrides.priority,
  material: overrides.material ?? 'algodon',
  care: overrides.care ?? 'lavado',
  origin: overrides.origin ?? 'Valencia',
  content: overrides.content ?? 'Contenido',
  gallery: overrides.gallery ?? [],
  available: overrides.available,
  metadata: (overrides.metadata ?? {}) as Product['metadata']
})

describe('prepareCatalogProducts', () => {
  it('preserves basic fields and derives availability from number of photos', () => {
    const products = [
      buildProduct({ id: 'has-photos', photos: 3 }),
      buildProduct({ id: 'no-photos', photos: 0 })
    ]

    const result = prepareCatalogProducts(products)

    expect(result).toHaveLength(2)
    expect(result.find(product => product.id === 'has-photos')?.available).toBe(true)
    expect(result.find(product => product.id === 'no-photos')?.available).toBe(false)
  })

  it('falls back to the default priority when missing', () => {
    const products = [buildProduct({ priority: undefined })]

    const [single] = prepareCatalogProducts(products)
    expect(single.priority).toBe(DEFAULT_PRODUCT_PRIORITY)
  })

  it('propagates hero placeholders when present in metadata', () => {
    const placeholder = 'data:image/webp;base64,abc'
    const products = [
      buildProduct({
        image: '/images/products/test.webp',
        metadata: {
          imagePlaceholders: {
            '/images/products/test.webp': placeholder
          }
        }
      })
    ]

    const [single] = prepareCatalogProducts(products)
    expect(single.imagePlaceholder).toBe(placeholder)
  })
})
