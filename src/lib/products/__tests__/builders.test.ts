import { describe, expect, it, vi, beforeEach } from 'vitest'

import { buildProductFromMarkdown, sanitiseProductInput } from '../builders'

vi.mock('../cache', () => ({
  getProductGallery: vi.fn(() => ['/images/products/demo.jpg']),
  getPricingTable: vi.fn(() => ({ demo: 42 })),
  productsDirectory: '/tmp',
  ensureProductsDirectory: vi.fn()
}))

describe('product builders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('construye un producto desde markdown aplicando galería y precios externos', () => {
    const markdown = `---
name: "Calcetín Demo"
price: 10
tags:
  - archivo
  - color 101
type: calcetin
metadata:
  display: "test"
---
Contenido`

    const product = buildProductFromMarkdown('demo', markdown)

    expect(product.id).toBe('demo')
    expect(product.image).toBe('/images/products/demo.jpg')
    expect(product.price).toBe(42)
    expect(product.metadata).toBeDefined()
  })

  it('normaliza entradas al sanitizar un payload de producto', () => {
    const payload = sanitiseProductInput({
      id: ' demo ',
      name: '  Producto ',
      description: 'Texto',
      price: '19.456' as unknown as number,
      tags: ['  rojo ', ' '],
      sizes: [' 38-40 '],
      available: true,
      metadata: { foo: 'bar' },
      category: 'calcetin'
    })

    expect(payload.id).toBe('demo')
    expect(payload.price).toBe(19.46)
    expect(payload.tags).toEqual(['rojo'])
    expect(payload.sizes).toEqual(['38-40'])
    expect(payload.metadata).toBeDefined()
  })
})
