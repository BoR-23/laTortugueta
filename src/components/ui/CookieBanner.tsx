'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'lt_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'accepted')
    }
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-3xl border border-neutral-200 bg-white px-6 py-4 text-sm shadow-lg sm:max-w-3xl sm:mx-auto">
      <p className="text-neutral-700">
        Usamos cookies necesarias para que la web funcione y opcionales para análisis. Consulta nuestra{' '}
        <Link href="/cookies" className="font-semibold text-neutral-900 underline">
          política de cookies
        </Link>{' '}
        y acepta para seguir navegando.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleAccept}
          className="btn-primary px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          Aceptar cookies
        </button>
      </div>
    </div>
  )
}
