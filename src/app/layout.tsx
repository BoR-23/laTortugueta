import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutShell } from '@/components/layout/LayoutShell'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import {
  siteMetadata,
  getSiteUrl,
  defaultOpenGraphImage,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd
} from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })

import { getSiteSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  const title = settings.seo_title || siteMetadata.name
  const description = settings.seo_description || siteMetadata.description
  const ogImage = settings.seo_og_image || defaultOpenGraphImage

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  const icons = r2Url
    ? {
      icon: [
        { url: `${r2Url}/favicons/favicon.ico`, sizes: 'any' },
        { url: `${r2Url}/favicons/android-chrome-192x192.png`, sizes: '192x192', type: 'image/png' },
        { url: `${r2Url}/favicons/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
        { url: `${r2Url}/favicons/android-chrome-512x512.png`, sizes: '512x512', type: 'image/png' }
      ],
      apple: [
        { url: `${r2Url}/favicons/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }
      ]
    }
    : undefined

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s · ${siteMetadata.name}`
    },
    description: description,
    applicationName: siteMetadata.name,
    keywords: siteMetadata.keywords,
    icons: icons,
    openGraph: {
      title: title,
      description: description,
      type: 'website',
      url: getSiteUrl(),
      siteName: siteMetadata.name,
      locale: siteMetadata.locale,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage]
    }
  }
}

export const viewport = {
  themeColor: "#f8f5ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const structuredData = JSON.stringify([buildOrganizationJsonLd(), buildWebsiteJsonLd()])

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Language" content="es" />

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      </head>
      <body className={inter.className}>
        {gaMeasurementId ? (
          <Suspense fallback={null}>
            <GoogleAnalytics GA_MEASUREMENT_ID={gaMeasurementId} />
          </Suspense>
        ) : null}
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
