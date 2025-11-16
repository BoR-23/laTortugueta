'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void
  }
}

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const enable = () => setShouldLoad(true)
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let idleId: number | null = null

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
        idleId = null
        enable()
      })
    } else {
      timeoutId = setTimeout(() => {
        timeoutId = null
        enable()
      }, 2000)
    }

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      if (idleId !== null && 'cancelIdleCallback' in window) {
        ;(window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId)
      }
    }
  }, [])

  useEffect(() => {
    if (!pathname || typeof window === 'undefined' || !window.gtag) return
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    })
  }, [pathname, searchParams, GA_MEASUREMENT_ID])

  if (!shouldLoad) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}
