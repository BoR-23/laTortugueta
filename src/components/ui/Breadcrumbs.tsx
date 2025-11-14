'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export type BreadcrumbItem = {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="bg-white">
      <ol className="mx-auto flex max-w-6xl 3xl:max-w-8xl list-none gap-2 px-4 py-4 text-xs uppercase tracking-[0.3em] text-neutral-500 sm:px-6 lg:px-8">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const content: ReactNode = item.href && !isLast ? (
            <Link href={item.href} className="text-neutral-500 hover:text-neutral-900">
              {item.label}
            </Link>
          ) : (
            <span className={isLast ? 'text-neutral-900' : undefined}>{item.label}</span>
          )
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {content}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
