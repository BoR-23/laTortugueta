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

import { ClientSessionProvider } from '@/components/providers/ClientSessionProvider'
import { getSiteSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  const title = settings.seo_title || siteMetadata.name
  // SAFETY CHECK: If the DB has garbage (Base64 images), ignore it.
  const rawOgImage = settings.seo_og_image
  const ogImage = (rawOgImage && rawOgImage.length < 500 && !rawOgImage.startsWith('data:'))
    ? rawOgImage
    : defaultOpenGraphImage

  const rawDescription = settings.seo_description || siteMetadata.description
  const description = (rawDescription && rawDescription.length < 500)
    ? rawDescription
    : siteMetadata.description

  // DIAGNOSTIC LOGGING (Keep enabled to catch other issues)
  if (settings.seo_og_image && settings.seo_og_image.length > 500) {
    console.warn(`[WARN] Giant SEO OG Image from DB ignored (${settings.seo_og_image.length} chars).`)
  }
  if (description && description.length > 1000) {
    console.warn(`[WARN] Giant Description detected (${description.length} chars).`)
  }



  return {
    metadataBase: new URL(getSiteUrl()),
    alternates: {
      canonical: './',
    },
    title: {
      default: title,
      template: `%s · ${siteMetadata.name}`
    },
    description: description,
    applicationName: siteMetadata.name,
    keywords: siteMetadata.keywords,

    icons: {
      icon: [
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
        { url: '/icon.png', type: 'image/png', sizes: '32x32' },
        { url: '/icon-96.png', type: 'image/png', sizes: '96x96' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ]
    },
    appleWebApp: {
      title: siteMetadata.name,
      statusBarStyle: 'default',
      capable: true
    },
    openGraph: {
      title: title,
      description: description,
      type: 'website',
      url: getSiteUrl(),
      siteName: siteMetadata.name, // "La Tortugueta"
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
        <meta property="og:site_name" content={siteMetadata.name} />

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
        <ClientSessionProvider>
          <LayoutShell>{children}</LayoutShell>
        </ClientSessionProvider>
      </body>
    </html>
  )
}
