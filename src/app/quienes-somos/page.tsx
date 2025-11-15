import type { Metadata } from 'next'
import Link from 'next/link'

import { getAllProducts } from '@/lib/products'
import { CONTACT_NAME, INSTAGRAM_URL, WHATSAPP_LINK } from '@/lib/contact'
import { absoluteUrl, siteMetadata } from '@/lib/seo'

type Section = {
  title: string
  paragraphs: string[]
}

const buildSections = (totalDesigns: number, yearsWeaving: number): Section[] => [
  {
    title: 'Quiénes somos',
    paragraphs: [
      'Calcetería artesana nacida en Alcoi y activa desde 1989.',
      'La Tortugueta es un taller familiar que documenta y reproduce calcetines tradicionales con tejedoras manuales históricas. Trabajamos sin stock, bajo pedido. Apostamos por la proximidad: tanto el hilo como los envases se compran a proveedores de la Comunitat Valenciana. Además, nuestro compromiso ambiental es total: tanto el etiquetaje como las cajas de envío son de material reciclado.'
    ]
  },
  {
    title: 'La historia de Macu',
    paragraphs: [
      'La Tortugueta nace en Alcoi (Alicante) en 1989 de la mano de Macu García, fundadora del "grup de danses" Sant Jordi, investigadora de indumentaria tradicional y coleccionista de tortugas. Detectó que casi no existían calcetines fieles a los originales y empezó a reproducirlos junto a una tejedora local.',
      'En lugar de inventar, reproducía con los calcetines antiguos en la mano, trasladando el dibujo exacto a la galga 10 (adaptada a las máquinas de principios del XX, ya que los originales del XIX eran de galga 12). Los primeros pares se hacían exactamente igual que el antiguo y, más tarde, se adaptaban los colores a petición del cliente. Gustaron tanto en su grupo de "danses" que pronto comenzaron los encargos.',
      'Durante los años 90 viajó semanalmente a Valencia para mostrar el muestrario en tiendas de indumentaria tradicional. En 2000 obtuvo el Sello de Artesanía de la Comunitat Valenciana (DECA nº 2324) —la única calcetería artesanal con esa acreditación—, en 2002 se constituyó como sociedad limitada y en 2011 recibió la Marca Parcs Naturals del Parc Natural del Carrascal de la Font Roja por su compromiso ambiental, del que nuestro etiquetaje en cartulina reciclada es un buen ejemplo.'
    ]
  },
  {
    title: 'El taller hoy',
    paragraphs: [
      'Hoy continúa como empresa familiar: la siguiente generación mantiene vivas las tejedoras manuales, documenta cada modelo y conserva el oficio con la misma filosofía de siempre. No inventamos diseños nuevos; rescatamos piezas históricas para que sigan luciéndose tal como fueron concebidas, encontrando los originales en personas que nos los ceden, en museos, libros y visitas a archivos históricos donde fotografiamos los modelos antiguos.',
      `Custodiamos un archivo con más de ${totalDesigns} modelos descritos al detalle y llevamos ${yearsWeaving} años consecutivos tejiendo, restaurando y difundiendo este oficio sin atajos industriales.`
    ]
  },
  {
    title: 'Nuestros productos',
    paragraphs: [
      'Nuestro día a día se reparte entre varias familias de piezas, la mayoría tejidas en algodón 100% del número 12 y todas con la costura lateral cosida a mano.',
      'Los más conocidos son los calcetines rayados: medias por bajo de la rodilla (conforme son las antiguas) con franjas geométricas y combinaciones cromáticas históricas. También creamos calcetines bordados, piezas lisas a las que se añade bordado artesanal con motivos florales, o incluso de animales, usando máquinas antiguas de bordar.',
      'Ofrecemos medias lisas con un dibujo en el mismo color realizado en la propia tejedora manual, idénticas a las de la indumentaria valenciana clásica. Recuperamos piezas como las polainas y peúcos, que usaban los labradores, y confeccionamos bajo pedido cofias, barrets y lligacames. Estas últimas son cintas de otomán reproducidas de modelos antiguos, y las tenemos también bordadas con frases antiguas (en valenciano o castellano) sacadas de archivos históricos.',
      'Además, realizamos encargos para grupos de "danses" de otras comunidades que nos mandan sus modelos antiguos, habiendo trabajado para Zamora, Zaragoza, Burgos, Galicia, Cataluña y Mallorca.'
    ]
  },
  {
    title: 'Reconocimientos',
    paragraphs: [
      'Los reconocimientos oficiales acompañan, pero sobre todo son una garantía. Estamos orgullosos de nuestro Sello de Artesanía de la Comunitat Valenciana (DECA nº 2324) desde el año 2000, así como de la Marca Parcs Naturals del Parc Natural Font Roja (2011) por nuestros procesos respetuosos.',
      'Somos miembros del Centro de Artesanía de la Comunitat Valenciana y hemos sido finalistas en los Premios de Artesanía. Nuestro trabajo también ha llegado a grandes producciones, habiendo creado calcetería para cine, teatro y ópera, incluyendo películas como “Libertador” y “The Promise” (con un encargo de más de 200 pares) o para las sopranos del Teatro Real de Madrid. Detrás de cada sello hay un proceso manual que revisa tensión, vaporado y remates a mano antes de guardar cada calcetín en su envase de material reciclado.'
    ]
  },
  {
    title: 'Cómo trabajamos',
    paragraphs: [
      'Llegamos a las personas igual que en los años noventa, ahora reforzados por la comunicación digital. Atendemos encargos directos por teléfono, correo o WhatsApp, ya que todas nuestras piezas son a medida: pedimos altura de pierna, grueso del gemelo y número de pie. Nuestras colecciones también se pueden encontrar en tiendas especializadas en indumentaria tradicional y seguimos presentes en ferias de artesanía y eventos festivos. Mantenemos una atención a distancia con envíos nacionales e internacionales, apoyándonos en las redes sociales.'
    ]
  },
  {
    title: 'Memoria textil',
    paragraphs: [
      'Compartimos procesos porque la memoria textil necesita ser pública. Esto lo hacemos a través de reportajes en blogs como “Diario de una Peineta”, prensa local y revistas de fiestas, y mediante nuestra participación en producciones teatrales y de cine. Mantenemos una presencia constante en Facebook e Instagram (@latortugueta.calcetines), donde mostramos procesos y novedades.',
      'Hacemos un llamamiento: si tienes calcetines antiguos, fotografías o historias familiares, podemos documentarlas y devolverlas restauradas o replicadas para que sigan presentes en fiestas, escenarios y grupos de folclore.'
    ]
  }
]

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description:
    'Calcetería artesana nacida en Alcoi en 1989. Taller familiar que documenta modelos históricos, trabaja bajo pedido y apuesta por materiales de proximidad.',
  alternates: {
    canonical: absoluteUrl('/quienes-somos')
  },
  openGraph: {
    title: `${siteMetadata.name} · Quiénes somos`,
    description:
      'Taller familiar fundado por Macu García: tejemos calcetines tradicionales, restauramos modelos antiguos y trabajamos bajo pedido con materiales locales.',
    url: absoluteUrl('/quienes-somos'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteMetadata.name} · Quiénes somos`,
    description:
      'Calcetería artesana nacida en Alcoi y activa desde 1989. Oficio familiar con sello oficial de artesanía.'
  }
}

export default async function AboutPage() {
  const products = await getAllProducts()
  const totalDesigns = products.length
  const yearsWeaving = new Date().getFullYear() - 1989
  const whatsappDisplay = '+34 653 45 22 49'
  const sections = buildSections(totalDesigns, yearsWeaving)

  return (
    <div className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Quiénes somos</p>
          <h1 className="mt-3 text-4xl font-semibold text-neutral-900 sm:text-5xl">
            Calcetería artesana nacida en Alcoi y activa desde 1989.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            Documentamos y reproducimos calcetines tradicionales con tejedoras manuales históricas, siempre
            bajo pedido y con materiales de proximidad. Esta página resume la historia completa del taller y
            cómo seguimos trabajando hoy.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-5xl space-y-10 px-4 py-16 text-[15px] leading-relaxed text-neutral-700 sm:px-6 lg:px-8">
        {sections.map(section => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-2xl font-semibold text-neutral-900">{section.title}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.title}-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-neutral-900">Cómo contactar</h2>
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
        </section>

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
