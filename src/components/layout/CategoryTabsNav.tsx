'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type CategoryNavNode = {
  id: string
  name: string
  tagKey: string | null
  children?: CategoryNavNode[]
}

const normalise = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase()

interface CategoryTabsNavProps {
  tabs: CategoryNavNode[]
}

const findPath = (
  nodes: CategoryNavNode[],
  predicate: (node: CategoryNavNode) => boolean
): string[] | null => {
  for (const node of nodes) {
    if (predicate(node)) {
      return [node.id]
    }
    if (node.children?.length) {
      const childPath = findPath(node.children, predicate)
      if (childPath) {
        return [node.id, ...childPath]
      }
    }
  }
  return null
}

type NestedListProps = {
  nodes: CategoryNavNode[]
  activeLeafId: string | null
  navigateToTag: (tagKey: string | null) => void
  depth?: number
}

const NestedList = ({ nodes, activeLeafId, navigateToTag, depth = 0 }: NestedListProps) => (
  <div className={`flex flex-col gap-1.5 ${depth ? 'pl-4' : ''}`}>
    {nodes.map(node => {
      const hasChildren = Boolean(node.children?.length)
      const isClickable = Boolean(node.tagKey)
      const isActive = node.id === activeLeafId
      const textClasses = isActive
        ? 'text-neutral-900'
        : isClickable
        ? 'text-neutral-500 hover:text-neutral-900'
        : 'text-neutral-400'

      return (
        <div key={node.id} className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => (isClickable ? navigateToTag(node.tagKey) : undefined)}
            className={`text-left text-[10px] uppercase tracking-[0.2em] ${textClasses} ${isClickable ? '' : 'cursor-default'}`}
            disabled={!isClickable}
          >
            {node.name}
          </button>
          {hasChildren ? (
            <NestedList
              nodes={node.children!}
              activeLeafId={activeLeafId}
              navigateToTag={navigateToTag}
              depth={depth + 1}
            />
          ) : null}
        </div>
      )
    })}
  </div>
)

type DropdownColumnProps = {
  node: CategoryNavNode
  activeLeafId: string | null
  navigateToTag: (tagKey: string | null) => void
}

const DropdownColumn = ({ node, activeLeafId, navigateToTag }: DropdownColumnProps) => {
  const isHeadingClickable = Boolean(node.tagKey)
  const isHeadingActive = node.id === activeLeafId
  const hasChildren = Boolean(node.children?.length)

  return (
    <div className="min-w-[180px] flex-1">
      <button
        type="button"
        onClick={() => (isHeadingClickable ? navigateToTag(node.tagKey) : undefined)}
        className={`text-left text-[11px] font-semibold uppercase tracking-[0.35em] ${
          isHeadingActive
            ? 'text-neutral-900'
            : isHeadingClickable
            ? 'text-neutral-500 hover:text-neutral-900'
            : 'text-neutral-400'
        } ${isHeadingClickable ? '' : 'cursor-default'}`}
        disabled={!isHeadingClickable}
      >
        {node.name}
      </button>
      {hasChildren ? (
        <div className="mt-3">
          <NestedList nodes={node.children!} activeLeafId={activeLeafId} navigateToTag={navigateToTag} />
        </div>
      ) : null}
    </div>
  )
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 12 8"
    className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`}
    aria-hidden="true"
  >
    <path
      d="M1.5 2.5 6 6l4.5-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function CategoryTabsNav({ tabs }: CategoryTabsNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tagsParam = searchParams.get('tags') ?? ''
  const isCatalogRoute = pathname === '/'
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const activeTagKey = useMemo(() => {
    if (!tagsParam) return null
    const [first] = tagsParam.split(',').map(token => normalise(token))
    return first ?? null
  }, [tagsParam])

  const activePath = useMemo(() => {
    if (!isCatalogRoute) return null
    if (!activeTagKey) {
      const fallback = tabs.find(tab => !tab.tagKey)
      return fallback ? [fallback.id] : null
    }
    return findPath(tabs, node => Boolean(node.tagKey) && normalise(node.tagKey!) === activeTagKey)
  }, [activeTagKey, isCatalogRoute, tabs])

  const activeRootId = activePath ? activePath[0] : null
  const activeLeafId = activePath ? activePath[activePath.length - 1] : null

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setOpenMenuId(null)
  }, [pathname, tagsParam])

  if (!tabs.length) return null

  const navigateToTag = (tagKey: string | null) => {
    const params = new URLSearchParams()
    if (tagKey) {
      params.set('tags', tagKey)
    }
    const target = params.toString() ? `/?${params.toString()}` : '/'
    router.replace(target, { scroll: false })
    setOpenMenuId(null)
  }

  const handleToggleMenu = (tabId: string) => {
    setOpenMenuId(prev => (prev === tabId ? null : tabId))
  }

  const openMenu = openMenuId ? tabs.find(tab => tab.id === openMenuId) ?? null : null

  return (
    <div ref={wrapperRef} className="hidden flex-col gap-4 md:flex">
      <nav
        className="flex flex-wrap items-center justify-start gap-y-2 gap-x-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500"
        aria-label="Categorías del catálogo"
      >
        {tabs.map(tab => {
          const hasChildren = Boolean(tab.children?.length)
          const isActive = tab.id === activeRootId
          const isOpen = tab.id === openMenuId
          const labelIsClickable = Boolean(tab.tagKey)

          const handleLabelClick = () => {
            if (labelIsClickable) {
              navigateToTag(tab.tagKey)
            } else if (hasChildren) {
              handleToggleMenu(tab.id)
            }
          }

          return (
            <div key={tab.id} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={handleLabelClick}
                className={`inline-flex items-center px-0 py-1 leading-[1.6] transition ${
                  isActive || isOpen ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.name}
              </button>

              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => handleToggleMenu(tab.id)}
                  aria-label={isOpen ? 'Cerrar submenú' : 'Abrir submenú'}
                  aria-expanded={isOpen}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-neutral-500 transition ${
                    isOpen ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  <ChevronIcon open={isOpen} />
                </button>
              ) : null}
            </div>
          )
        })}
      </nav>

      {openMenu && openMenu.children?.length ? (
        <div
          className="w-full rounded-none border border-neutral-200 bg-white px-8 py-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)]"
          role="menu"
          aria-label={`Subcategorías de ${openMenu.name}`}
        >
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {openMenu.children.map(child => (
              <DropdownColumn
                key={child.id}
                node={child}
                activeLeafId={activeLeafId}
                navigateToTag={navigateToTag}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
