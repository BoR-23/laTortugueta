import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/products'
import { absoluteUrl, siteMetadata } from '@/lib/seo'
import { AboutContent } from '@/components/about/AboutContent'
import { dictionaries } from '@/i18n/dictionaries'

export const metadata: Metadata = {
    title: dictionaries.en.about.metaTitle,
    description: dictionaries.en.about.metaDescription,
    alternates: {
        canonical: absoluteUrl('/en/quienes-somos'),
        languages: {
            'es': '/quienes-somos',
            'ca': '/ca/quienes-somos',
            'en': '/en/quienes-somos'
        }
    },
    openGraph: {
        title: `${siteMetadata.name} · ${dictionaries.en.about.metaTitle}`,
        description: dictionaries.en.about.metaDescription,
        url: absoluteUrl('/en/quienes-somos'),
        type: 'website'
    }
}

export default async function AboutPageEn() {
    const products = await getAllProducts()
    const totalDesigns = products.length
    const yearsWeaving = new Date().getFullYear() - 1989

    return (
        <AboutContent
            totalDesigns={totalDesigns}
            yearsWeaving={yearsWeaving}
            locale="en"
        />
    )
}
