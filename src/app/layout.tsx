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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteMetadata.name} · ${siteMetadata.shortDescription}`,
    template: `%s · ${siteMetadata.name}`
  },
  description: siteMetadata.description,
  applicationName: siteMetadata.name,
  keywords: siteMetadata.keywords,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: siteMetadata.name,
    description: siteMetadata.description,
    type: 'website',
    url: getSiteUrl(),
    siteName: siteMetadata.name,
    locale: siteMetadata.locale,
    images: [
      {
        url: defaultOpenGraphImage,
        width: 1200,
        height: 630,
        alt: siteMetadata.name
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.name,
    description: siteMetadata.description,
    images: [defaultOpenGraphImage]
  },
  icons: {
    icon: [
      { url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/favicons/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
      { url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/favicons/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/favicons/favicon.ico`, sizes: 'any' }
    ],
    apple: [
      { url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/favicons/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }
    ]
  },

}

export const viewport = {
  themeColor: "#f8f5ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
