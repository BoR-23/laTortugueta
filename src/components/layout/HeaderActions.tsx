'use client'

import Link from 'next/link'

interface HeaderActionsProps {
  className?: string
}

const BASE_BUTTON_CLASSES = 'transition hover:text-neutral-900'

export function HeaderActions({ className = '' }: HeaderActionsProps) {
  return (
    <div className={`flex items-center justify-end gap-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-600 ${className}`}>
      <Link href="/admin" className={BASE_BUTTON_CLASSES} title="Panel de gestión">
        Gestión
      </Link>
    </div>
  )
}
