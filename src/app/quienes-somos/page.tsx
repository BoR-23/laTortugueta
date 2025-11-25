import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/products'
import { absoluteUrl, siteMetadata } from '@/lib/seo'
import { AboutContent } from '@/components/about/AboutContent'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description:
    'Calcetería artesana nacida en Alcoi en 1989. Taller familiar que documenta modelos históricos, trabaja bajo pedido y apuesta por materiales de proximidad.',
  alternates: {
    canonical: absoluteUrl('/quienes-somos'),
    languages: {
      'es': '/quienes-somos',
      'ca': '/ca/quienes-somos',
      'en': '/en/quienes-somos'
    }
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

  return (
    <AboutContent
      totalDesigns={totalDesigns}
      yearsWeaving={yearsWeaving}
      locale="es"
    />
  )
}
