import type { MetadataRoute } from 'next'
import { getHeroSlides } from '@/lib/banners'
import { siteMetadata } from '@/lib/seo'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // 1. Obtenemos los banners activos para usarlos como capturas
  const slides = await getHeroSlides()
  const activeSlides = slides.filter(s => s.active)

  // 2. Base URL de tus imágenes en R2 (la misma que usas en layout)
  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

  return {
    name: siteMetadata.name,
    short_name: 'La Tortugueta',
    description: siteMetadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f5ef',
    theme_color: '#f8f5ef',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    // 3. Añadimos las fotos del banner como "screenshots" para la instalación
    screenshots: activeSlides.map(slide => ({
      src: slide.image_url,
      sizes: '1080x1920', // Tamaño estimado, o puedes omitirlo
      type: 'image/jpeg', // Asumiendo jpg/png según tus subidas
      label: slide.title || 'Catálogo La Tortugueta'
    }))
  }
}
