import Link from 'next/link'
import type { ReactNode } from 'react'

import { footerNavLinks, primaryNavLinks } from '@/lib/navigation'
import { HeaderActions } from './HeaderActions'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { LanguageSwitcher } from './LanguageSwitcher'
import { HeaderNav } from './HeaderNav'

interface LayoutShellProps {
  children: ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl items-center justify-between px-3 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-semibold font-sans uppercase tracking-[0.3em] text-neutral-900 sm:text-2xl sm:tracking-[0.35em] whitespace-nowrap"
            aria-label="Ir al inicio - La Tortugueta"
          >
            La Tortugueta
          </Link>
          <div className="flex flex-1 items-center justify-end gap-6 pl-6">
            <LanguageSwitcher />
            <HeaderActions />
            <HeaderNav />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl flex-col gap-6 px-4 py-12 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 max-w-xl">
            <p className="leading-relaxed">
              Catálogo vivo de calcetería artesanal documentado y conservado por La Tortugueta. Ediciones
              limitadas disponibles bajo pedido personalizado.
            </p>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p>C/ San Nicolás 12, 03801 Alcoy (Alicante)</p>
              <p>WhatsApp: +34 653 452 249</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em]">
            {footerNavLinks.map(link =>
              link.external ? (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  )
}
