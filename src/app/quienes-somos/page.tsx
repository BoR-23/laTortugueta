import type { Metadata } from 'next'
import Link from 'next/link'

import { getAllProducts } from '@/lib/products'
import { CONTACT_NAME, INSTAGRAM_URL, WHATSAPP_LINK } from '@/lib/contact'

const storyParagraphs = [
  'La Tortugueta nace en Alcoi (Alicante) en 1989 de la mano de Macu García, fundadora del Grup de Danses Sant Jordi, investigadora de indumentaria tradicional y coleccionista de tortugas. Detectó que casi no existían calcetines fieles a los originales y empezó a reproducirlos junto a una tejedora local: dibujaba cada patrón, elegía los hilos y los primeros pares gustaron tanto en su grupo de danza que pronto comenzaron los encargos.',
  'Durante los años 90 viajó semanalmente a Valencia para mostrar el muestrario en tiendas de indumentaria tradicional. En 2000 obtuvo el Sello de Artesanía de la Comunitat Valenciana (DECA nº 2324) —la única calcetería artesanal con esa acreditación—, en 2002 se constituyó como sociedad limitada y en 2011 recibió la Marca Parcs Naturals del Parc Natural del Carrascal de la Font Roja por su compromiso ambiental.',
  'Hoy continúa como empresa familiar: la siguiente generación mantiene vivos los telares, documenta cada modelo y conserva el oficio con la misma filosofía de siempre. No inventamos diseños nuevos; rescatamos piezas históricas para que sigan luciéndose tal como fueron concebidas.'
]

const productHighlights = [
  {
    title: 'Calcetines rayados',
    description:
      'Medias largas con franjas geométricas y combinaciones cromáticas históricas. Se tejen con varios hilos a la vez para recrear fielmente los patrones antiguos.'
  },
  {
    title: 'Calcetines bordados',
    description:
      'Piezas lisas a las que se añade bordado artesanal con motivos florales tradicionales. Cada puntada se realiza a mano siguiendo el diseño original.'
  },
  {
    title: 'Medias con talón',
    description:
      'Calcetines altos con forma completa de pie, idénticos a los usados en la indumentaria valenciana clásica. Tienen remates en ganchillo y costura interior cosida a mano.'
  },
  {
    title: 'Polainas y peúcos',
    description:
      'Perneras para trabajo agrícola y pequeños escarpines de bebé. También confeccionamos cofias, barrets, mocadors, lligacames y escapularios bajo pedido.'
  }
]

const recognitions = [
  'Sello de Artesanía de la Comunitat Valenciana (DECA nº 2324) desde el año 2000.',
  'Marca Parcs Naturals del Parc Natural Font Roja (2011) por procesos respetuosos con el entorno.',
  'Miembros del Centro de Artesanía de la Comunitat Valenciana y finalistas en los Premios de Artesanía.',
  'Calcetería para cine y teatro: producciones como “Libertador” o “The Promise” encargaron más de 200 pares.'
]

const channels = [
  'Encargos directos por teléfono, correo o WhatsApp para piezas a medida.',
  'Tiendas especializadas en indumentaria tradicional que distribuyen nuestras colecciones.',
  'Ferias de artesanía, mercados medievales y eventos festivos de la Comunitat Valenciana.',
  'Atención a distancia con envíos nacionales e internacionales apoyándonos en redes sociales.'
]

const mediaMentions = [
  'Reportajes en blogs como “Diario de una Peineta”, prensa local y revistas de fiestas.',
  'Participación en recreaciones históricas y producciones teatrales.',
  'Presencia constante en Facebook e Instagram (@latortugueta.calcetines) mostrando procesos y novedades.'
]

export const metadata: Metadata = {
  title: 'Quiénes somos · La Tortugueta',
  description:
    'Conoce la historia de la calcetería artesanal de Alcoi fundada por Macu García. Hecho a mano desde 1989, con sello oficial de artesanía y producción limitada.'
}

export default async function AboutPage() {
  const products = await getAllProducts()
  const totalDesigns = products.length
  const yearsWeaving = new Date().getFullYear() - 1989
  const whatsappDisplay = '+34 653 45 22 49'

  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Quiénes somos</p>
          <h1 className="mt-3 text-4xl font-semibold text-neutral-900 sm:text-5xl">
            Calcetería artesana nacida en Alcoi y activa desde 1989.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            La Tortugueta es un taller familiar que documenta y reproduce calcetines tradicionales con telares
            históricos. Trabajamos sin stock masivo, bajo pedido y acompañando cada entrega de la
            documentación que garantiza su fidelidad.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-5xl space-y-8 px-4 py-16 text-[15px] leading-relaxed text-neutral-700 sm:px-6 lg:px-8">
        {storyParagraphs.map(paragraph => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <p>
          Tres décadas después conservamos los mismos telares y una metodología que combina libretas,
          fotografías y digitalización. Custodiamos un archivo con más de {totalDesigns} diseños descritos
          al detalle y llevamos {yearsWeaving} años consecutivos tejiendo, restaurando y difundiendo este
          oficio sin atajos industriales.
        </p>

        <p>
          Nuestro día a día se reparte entre varias familias de piezas.{' '}
          {productHighlights.map((product, index) => (
            <span key={product.title}>
              <strong>{product.title}</strong> {product.description}
              {index < productHighlights.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>

        <p>
          Los reconocimientos oficiales acompañan, pero sobre todo son una garantía para quienes confían en
          nosotros: {recognitions.join(' ')} Detrás de cada sello hay un proceso manual que revisa tensión,
          vaporado y remates a mano antes de guardar cada calcetín en su carpeta.
        </p>

        <p>
          Llegamos a las personas igual que en los años noventa, ahora reforzados por la comunicación digital:
          {` ${channels.join(' ')}`}
        </p>

        <p>
          Compartimos procesos porque la memoria textil necesita ser pública. {mediaMentions.join(' ')} Si
          tienes calcetines antiguos, fotografías o historias familiares, podemos documentarlas y devolverlas
          restauradas o replicadas para que sigan presentes en fiestas y escenarios.
        </p>

        <p>
          Para hablar con nosotros solo tienes que escribir a{' '}
          <a href={WHATSAPP_LINK} className="underline underline-offset-4">
            {whatsappDisplay}
          </a>{' '}
          (WhatsApp), contactar en{' '}
          <a href={INSTAGRAM_URL} className="underline underline-offset-4">
            Instagram
          </a>{' '}
          o pedir cita con {CONTACT_NAME}. Respondemos sin intermediarios y cada pedido se teje a medida.
        </p>

        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.35em] text-neutral-500">
          <Link href="/catalogo" className="rounded-full border border-neutral-900 px-6 py-3">
            Ver catálogo
          </Link>
          <a href={WHATSAPP_LINK} className="rounded-full border border-neutral-900 px-6 py-3">
            Abrir WhatsApp
          </a>
        </div>
      </article>
    </div>
  )
}
