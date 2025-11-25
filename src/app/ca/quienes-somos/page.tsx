import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/products'
import { absoluteUrl, siteMetadata } from '@/lib/seo'
import { AboutContent } from '@/components/about/AboutContent'
import { dictionaries } from '@/i18n/dictionaries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: dictionaries.ca.about.metaTitle,
    description: dictionaries.ca.about.metaDescription,
    alternates: {
        canonical: absoluteUrl('/ca/quienes-somos'),
        languages: {
            'es': '/quienes-somos',
            'ca': '/ca/quienes-somos',
            'en': '/en/quienes-somos'
        }
    },
    openGraph: {
        title: `${siteMetadata.name} · ${dictionaries.ca.about.metaTitle}`,
        description: dictionaries.ca.about.metaDescription,
        url: absoluteUrl('/ca/quienes-somos'),
        type: 'website'
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
