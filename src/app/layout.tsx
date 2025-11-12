import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutShell } from '@/components/layout/LayoutShell'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'La Tortugueta - Calcetines Artesanales Tradicionales',
  description:
    'Descubre nuestra colección de más de 300 diseños de calcetines tradicionales tejidos a mano con técnicas ancestrales.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Language" content="es" />
      </head>
      <body className={inter.className}>
        {gaMeasurementId ? <GoogleAnalytics GA_MEASUREMENT_ID={gaMeasurementId} /> : null}
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
