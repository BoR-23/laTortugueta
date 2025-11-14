import { WHATSAPP_LINK } from './contact'

export type NavigationLink = {
  label: string
  href: string
  external?: boolean
}

export const primaryNavLinks: NavigationLink[] = [
  { label: 'Catálogo', href: '/#colecciones' },
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
  { label: 'Política de privacidad', href: '/politica-privacidad' }
  ,
  { label: 'FAQ', href: '/faq' },
  { label: 'Aviso legal', href: '/aviso-legal' },
  { label: 'Cookies', href: '/cookies' }
]
