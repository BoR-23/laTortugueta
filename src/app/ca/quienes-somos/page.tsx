import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/products'
import { absoluteUrl, siteMetadata } from '@/lib/seo'
import { AboutContent } from '@/components/about/AboutContent'
import { dictionaries } from '@/i18n/dictionaries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Qui Som | Taller Artesà de Calcetins Tradicionals',
    description: 'Coneix La Tortugueta, taller artesà de calcetins tradicionals valencians des de 1989. Història, ofici familiar i encàrrecs personalitzats des d’Alcoi.',
    alternates: {
        canonical: absoluteUrl('/ca/quienes-somos'),
        languages: {
            'es': '/quienes-somos',
            'ca': '/ca/quienes-somos',
            'en': '/en/quienes-somos'
        }
    },
    openGraph: {
        title: `${siteMetadata.name} · Qui som`,
        description: 'Descobreix la història de La Tortugueta, un taller familiar especialitzat en calcetins tradicionals valencians, referències històriques i treball per encàrrec.',
        url: absoluteUrl('/ca/quienes-somos'),
        type: 'website'
    },
    twitter: {
        card: 'summary_large_image',
        title: `${siteMetadata.name} · Qui som`,
        description: 'Taller familiar de calcetins tradicionals valencians des de 1989, amb ofici artesà i producció personalitzada.'
    }
}

export default async function AboutPageCa() {
    const products = await getAllProducts()
    const totalDesigns = products.length
    const yearsWeaving = new Date().getFullYear() - 1989

    return (
        <AboutContent
            totalDesigns={totalDesigns}
            yearsWeaving={yearsWeaving}
            locale="ca"
        />
    )
}
