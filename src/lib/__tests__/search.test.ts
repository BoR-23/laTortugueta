import { describe, expect, it } from 'vitest'

import { expandSearchQuery, normaliseSearchValue } from '../search'

describe('search helpers', () => {
  it('normalises diacritics and punctuation', () => {
    expect(normaliseSearchValue('Búsqueda súper rÁpida!')).toBe('busqueda super rapida')
  })

  it('expands aliases and splits multi word queries', () => {
    const terms = expandSearchQuery('Calcetines dos colores')

    expect(terms).toEqual(
      expect.arrayContaining(['calcetines dos colores', 'calcetines', 'dos', 'colores', 'de dos colors'])
    )
  })
})
