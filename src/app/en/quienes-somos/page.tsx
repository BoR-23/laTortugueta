import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/products'
import { absoluteUrl, siteMetadata } from '@/lib/seo'
import { AboutContent } from '@/components/about/AboutContent'
import { dictionaries } from '@/i18n/dictionaries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'About Us | Traditional Valencian Socks Workshop',
    description: 'Meet La Tortugueta, a family workshop crafting traditional Valencian socks since 1989. Heritage, craftsmanship and bespoke orders from Alcoi.',
    alternates: {
        canonical: absoluteUrl('/en/quienes-somos'),
        languages: {
            'es': '/quienes-somos',
            'ca': '/ca/quienes-somos',
            'en': '/en/quienes-somos'
        }
    },
    openGraph: {
        title: `${siteMetadata.name} · About us`,
        description: 'Discover the story of La Tortugueta, a family workshop focused on traditional Valencian socks, historical references and made-to-order craftsmanship.',
        url: absoluteUrl('/en/quienes-somos'),
        type: 'website'
    },
    twitter: {
        card: 'summary_large_image',
        title: `${siteMetadata.name} · About us`,
        description: 'Family workshop for traditional Valencian socks since 1989, with heritage craft and bespoke production.'
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
