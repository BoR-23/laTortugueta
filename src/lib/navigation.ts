import { WHATSAPP_LINK, INSTAGRAM_URL } from './contact'

export type NavigationLink = {
  label: string
  href: string
  external?: boolean
}

export const primaryNavLinks: NavigationLink[] = [
  { label: 'Catálogo', href: '/#colecciones' },
  { label: 'Colores', href: '/colores' },
  { label: 'Blog', href: '/blog' },
  { label: 'Quiénes somos', href: '/quienes-somos' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'WhatsApp', href: WHATSAPP_LINK, external: true }
]

export const footerNavLinks: NavigationLink[] = [
  { label: 'Contacto', href: '/contacto' },
  { label: 'Blog', href: '/blog' },
  { label: 'Colecciones', href: '/#colecciones' },
  { label: 'Quiénes somos', href: '/quienes-somos' },
  { label: 'Instagram', href: INSTAGRAM_URL, external: true },
  { label: 'Política de privacidad', href: '/politica-privacidad' }
  ,
  { label: 'FAQ', href: '/faq' },
  { label: 'Aviso legal', href: '/aviso-legal' },
  { label: 'Cookies', href: '/cookies' }
]
