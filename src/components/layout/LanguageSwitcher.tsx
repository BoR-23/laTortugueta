'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Locale } from '@/i18n/dictionaries'

export function LanguageSwitcher() {
    const pathname = usePathname()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const currentLocale = pathname.startsWith('/en') ? 'en' : pathname.startsWith('/ca') ? 'ca' : 'es'

    // Normalize path to check if it's a supported route
    const cleanPath = pathname
        .replace(/^\/(en|ca)/, '') // Remove locale prefix
        .replace(/\/$/, '') // Remove trailing slash

    const isSupportedRoute =
        cleanPath === '/blog' ||
        cleanPath.startsWith('/blog/') ||
        cleanPath === '/quienes-somos'

    // Don't render on server or unsupported routes to prevent hydration mismatch
    if (!mounted || !isSupportedRoute) {
        return null
    }

    const handleLanguageChange = (newLocale: Locale) => {
        let newPath = pathname

        // Remove current locale prefix if exists
        if (pathname.startsWith('/en')) newPath = pathname.replace('/en', '')
        else if (pathname.startsWith('/ca')) newPath = pathname.replace('/ca', '')

        // Add new locale prefix if not default (es)
        if (newLocale !== 'es') {
            newPath = `/${newLocale}${newPath}`
        }

        // Ensure root path is handled correctly
        if (newPath === '') newPath = '/'

        router.push(newPath)
    }

    return (
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
            <button
                onClick={() => handleLanguageChange('es')}
                className={`hover:text-neutral-900 transition-colors ${currentLocale === 'es' ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}
            >
                ES
            </button>
            <span className="text-neutral-300">/</span>
            <button
                onClick={() => handleLanguageChange('ca')}
                className={`hover:text-neutral-900 transition-colors ${currentLocale === 'ca' ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}
            >
                VA
            </button>
            <span className="text-neutral-300">/</span>
            <button
                onClick={() => handleLanguageChange('en')}
                className={`hover:text-neutral-900 transition-colors ${currentLocale === 'en' ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}
            >
                EN
            </button>
        </div>
    )
}

