export type Testimonial = {
  name: string
  location: string
  quote: string
  role?: string
  photo?: string
}

export type TestimonialGroup = {
  id: string
  label: string
  description: string
  testimonials: Testimonial[]
  matchTags?: string[]
}

export const defaultTestimonialGroups: TestimonialGroup[] = [
  {
    id: 'danzas',
    label: 'Grupos de Danses',
    description:
      'Festes majors, collas falleras y escuelas de danza colaboran con el archivo para recrear piezas históricas idénticas a las originales.',
    matchTags: ['danza', 'danzas', 'folklore', 'ballet', 'fiesta', 'festes'],
    testimonials: [
      {
        name: 'Elena · Grup de Danses Sant Jordi',
        location: 'Alcoi',
        role: 'Dirección artística',
        quote:
          '“Cada temporada encargamos nuevas reproducciones y siempre llegan idénticas a las piezas originales del archivo familiar.”'
      },
      {
        name: 'Comissió de Festes de Xàtiva',
        location: 'València',
        role: 'Coordinación textil',
        quote:
          '“La Tortugueta es garantía de fidelidad histórica. Documentan el patrón y nos envían fotos de cada fase.”'
      },
      {
        name: 'Grup de Danses d’Ontinyent',
        location: 'Vall d’Albaida',
        role: 'Vestuario',
        quote:
          '“Guardan cada ficha en el archivo y así podemos encargar reposiciones sin empezar desde cero.”'
      }
    ]
  },
  {
    id: 'escenico',
    label: 'Teatro y audiovisual',
    description:
      'Compañías escénicas y producciones audiovisuales buscan rapidez y consistencia; entregamos fichas técnicas cerradas y versiones extra para vestuarios de rodaje.',
    matchTags: ['teatro', 'escena', 'produccion', 'rodaje', 'audiovisual'],
    testimonials: [
      {
        name: 'Teatre Escalante',
        location: 'València',
        role: 'Dirección de vestuario',
        quote:
          '“Para la última producción necesitábamos más de 60 pares con urgencia. Respondieron rápido y los actores quedaron maravillados.”'
      },
      {
        name: 'Ballet de la Generalitat',
        location: 'València',
        role: 'Coordinación de sastrería',
        quote:
          '“Nos enviaron muestras de color en 48h y aprobaron las tallas por videollamada. Ningún ajuste al recibirlos.”'
      },
      {
        name: 'Productora Vent de Llevant',
        location: 'Castelló',
        role: 'Departamento de arte',
        quote:
          '“Necesitábamos fieles reproducciones de los años 50 para un rodaje exterior y quedaron listos semanas antes de lo previsto.”'
      }
    ]
  },
  {
    id: 'coleccionistas',
    label: 'Coleccionistas y archivo',
    description:
      'Restauramos pares únicos para familias y museos locales, cuidando documentación, humedad y guardado para que las piezas duren generaciones.',
    matchTags: ['archivo', 'museo', 'coleccion', 'restauracion', 'patrimonio'],
    testimonials: [
      {
        name: 'Arxiu Municipal d’Alcoi',
        location: 'Alcoi',
        role: 'Área de patrimonio',
        quote:
          '“Digitalizan cada muestra y adjuntan certificado. Es un servicio de conservación textil completo.”'
      },
      {
        name: 'Colección privada García',
        location: 'Alicante',
        role: 'Conservación familiar',
        quote:
          '“Heredamos prendas muy frágiles y ahora tenemos réplicas listas para usar sin arriesgar las originales.”'
      },
      {
        name: 'Museu del Tèxtil Valencià',
        location: 'València',
        role: 'Curaduría',
        quote:
          '“Su documentación y embalaje permiten exponer las piezas directamente. Cada réplica llega con ficha completa.”'
      }
    ]
  }
]

export const defaultTestimonials: Testimonial[] = defaultTestimonialGroups
  .flatMap(group => group.testimonials)
  .slice(0, 3)
