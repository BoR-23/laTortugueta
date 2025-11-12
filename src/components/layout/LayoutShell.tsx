import Link from 'next/link'
import type { ReactNode } from 'react'

import { footerNavLinks, primaryNavLinks } from '@/lib/navigation'
import { HeaderActions } from './HeaderActions'

interface LayoutShellProps {
  children: ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl uppercase tracking-[0.35em] text-neutral-900"
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 600
            }}
            aria-label="Ir al inicio"
          >
            La Tortugueta
          </Link>
          <div className="flex flex-1 items-center justify-end gap-6 pl-6">
            <HeaderActions />
            <nav
              className="hidden flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 lg:flex"
              aria-label="Navegación secundaria"
            >
              {primaryNavLinks.map(link =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-neutral-900"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} className="transition hover:text-neutral-900">
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="max-w-xl leading-relaxed">
            Catálogo vivo de calcetería artesanal documentado y conservado por La Tortugueta. Ediciones
            limitadas disponibles bajo pedido personalizado.
          </p>
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
    </div>
  )
}
