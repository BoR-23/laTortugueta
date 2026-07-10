import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/products'
import { absoluteUrl, siteMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { AboutContent } from '@/components/about/AboutContent'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quiénes Somos | Taller Artesano de Calcetines Tradicionales',
  description:
    'Conoce La Tortugueta: taller artesano de calcetines tradicionales valencianos desde 1989. Historia, oficio familiar y encargos personalizados desde Alcoi.',
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
      'Descubre la historia de La Tortugueta, el taller familiar de Macu García especializado en calcetines tradicionales valencianos y reproducciones históricas.',
    url: absoluteUrl('/quienes-somos'),
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteMetadata.name} · Quiénes somos`,
    description:
      'Taller artesano de calcetines tradicionales valencianos desde 1989. Historia, oficio familiar y trabajo bajo pedido.'
  }
}

export default async function AboutPage() {
  const products = await getAllProducts()
  const totalDesigns = products.length
  const yearsWeaving = new Date().getFullYear() - 1989
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Inicio', url: '/' },
    { name: 'Quiénes Somos', url: '/quienes-somos' }
  ])

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AboutContent
        totalDesigns={totalDesigns}
        yearsWeaving={yearsWeaving}
        locale="es"
      />
    </>
  )
}
