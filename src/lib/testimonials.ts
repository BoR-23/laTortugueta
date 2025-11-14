export type Testimonial = {
  name: string
  location: string
  quote: string
  photo?: string
}

export const defaultTestimonials: Testimonial[] = [
  {
    name: 'Elena · Grupo de Danses Sant Jordi',
    location: 'Alcoi',
    quote:
      '“Cada temporada encargamos nuevas reproducciones y siempre llegan idénticas a las piezas originales del archivo familiar.”'
  },
  {
    name: 'Coordinadora de fiestas de Xàtiva',
    location: 'Valencia',
    quote: '“La Tortugueta es garantía de fidelidad histórica. Documentan el patrón y nos envían fotos de cada fase.”'
  },
  {
    name: 'Teatre Escalante',
    location: 'València',
    quote:
      '“Para la última producción necesitábamos más de 60 pares con urgencia. Respondieron rápido y los actores quedaron maravillados.”'
  }
]
