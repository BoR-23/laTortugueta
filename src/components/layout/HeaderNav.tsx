'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { primaryNavLinks } from '@/lib/navigation'
import { dictionaries } from '@/i18n/dictionaries'

export function HeaderNav() {
    const pathname = usePathname()
    const currentLocale = pathname.startsWith('/en') ? 'en' : pathname.startsWith('/ca') ? 'ca' : 'es'
    const t = dictionaries[currentLocale].nav

    // Map of label keys to match the dictionary keys
    const labelMap: Record<string, keyof typeof t> = {
        'Inicio': 'home',
        'Blog': 'blog',
        'Quiénes somos': 'about',
        'Catálogo': 'catalog',
        'Contacto': 'contact'
    }

    return (
        <nav
            className="hidden flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 lg:flex"
            aria-label="Navegación secundaria"
        >
            {primaryNavLinks.map(link => {
                const labelKey = labelMap[link.label]
                const label = labelKey ? t[labelKey] : link.label

                // Adjust href for locale only for supported routes
                let href = link.href
                const isSupportedRoute =
                    link.href === '/blog' ||
                    link.href.startsWith('/blog/') ||
                    link.href === '/quienes-somos'

                if (currentLocale !== 'es' && !link.external && !href.startsWith('/#') && isSupportedRoute) {
                    href = `/${currentLocale}${href}`
                }

                return link.external ? (
                    <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-neutral-900"
                    >
                        {label}
                    </a>
                ) : (
                    <Link key={link.label} href={href} className="transition hover:text-neutral-900">
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}
