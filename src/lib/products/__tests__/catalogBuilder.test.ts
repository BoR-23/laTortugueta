import { describe, expect, it } from 'vitest'

import { buildCatalogProductFromSupabase } from '../builders'

describe('buildCatalogProductFromSupabase', () => {
  it('builds a lightweight catalog product with the primary image and aggregated image tags', () => {
    const product = buildCatalogProductFromSupabase({
      id: 'set-llunes',
      name: 'Set Llunes',
      price: 50,
      tags: ['Dibujo Vertical', 'de Tres Colores'],
      sizes: ['36-38'],
      available: true,
      priority: 12,
      view_count: 7,
      image: '/images/products/set-llunes_001.jpg',
      image_tags: ['Color 100', 'Color 321'],
      photos: 10
    })

    expect(product).toMatchObject({
      id: 'set-llunes',
      name: 'Set Llunes',
      price: 50,
      tags: ['Dibujo Vertical', 'de Tres Colores'],
      sizes: ['36-38'],
      available: true,
      priority: 12,
      viewCount: 7,
      image: '/images/products/set-llunes_001.jpg',
      gallery: ['/images/products/set-llunes_001.jpg'],
      photos: 10
    })
    expect(product.mediaAssets).toEqual([
      {
        url: '/images/products/set-llunes_001.jpg',
        position: 0,
        tags: ['Color 100', 'Color 321']
      }
    ])
  })
})
