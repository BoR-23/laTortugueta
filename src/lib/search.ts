const stripAccents = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

export const normaliseSearchValue = (value: string) => stripAccents(value)

export const SEARCH_ALIASES: Record<string, string[]> = {
  rayas: ['ratlles', 'calces de ratlles'],
  rayados: ['ratlles', 'calces de ratlles'],
  rayes: ['ratlles', 'calces de ratlles'],
  stripes: ['ratlles', 'calces de ratlles'],
  lisas: ['llisses', 'calces llisses'],
  liso: ['llisses', 'calces llisses'],
  lisos: ['llisses', 'calces llisses'],
  lisa: ['llisses', 'calces llisses'],
  bordadas: ['mostraribrodades', 'calces mostraribrodades', 'brodat'],
  bordados: ['mostraribrodades', 'calces mostraribrodades', 'brodat'],
  bordado: ['mostraribrodades', 'calces mostraribrodades', 'brodat'],
  'bordadas a mano': ['calces brodades a ma'],
  'bordado a mano': ['calces brodades a ma'],
  fallero: ['faller', 'falleres majors i corts valencia'],
  fallera: ['faller', 'falleres majors i corts valencia'],
  falleros: ['faller', 'falleres majors i corts valencia'],
  falleras: ['faller', 'falleres majors i corts valencia'],
  hombre: ['de home'],
  hombres: ['de home'],
  caballero: ['de home'],
  caballeros: ['de home'],
  'dos colores': ['de dos colors'],
  '2 colores': ['de dos colors'],
  'tres colores': ['de tres colors'],
  '3 colores': ['de tres colors'],
  'cuatro colores': ['de cuatre colors'],
  '4 colores': ['de cuatre colors'],
  vertical: ['dibuix vertical'],
  letra: ['tots en lletra o nom', 'uno per nom'],
  nombre: ['tots en lletra o nom', 'uno per nom']
}

export const expandSearchQuery = (value: string) => {
  const normalised = stripAccents(value)
  if (!normalised) return []

  const terms = new Set<string>()
  terms.add(normalised)

  normalised.split(' ').forEach(token => {
    if (token.length > 1) {
      terms.add(token)
    }
  })

  Object.entries(SEARCH_ALIASES).forEach(([alias, targets]) => {
    if (normalised.includes(alias)) {
      targets.forEach(target => terms.add(target))
    }
  })

  return Array.from(terms).filter(Boolean)
}
