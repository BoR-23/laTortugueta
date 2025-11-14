import type { MetadataRoute } from 'next'
import { siteMetadata } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteMetadata.name,
    short_name: 'La Tortugueta',
    description: siteMetadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111111',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
