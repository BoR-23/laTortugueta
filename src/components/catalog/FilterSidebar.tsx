import { useMemo, useState } from 'react'
import type { RefObject } from 'react'
import type { CategorySidebarNode } from '@/types/categories'

import type {
  TagSummary,
  ColorCodeSummary,
  ColorCountSummary,
  SizeSummary,
  FilterState,
  SortKey,
  PriceStats
} from './catalogFiltering'

interface FilterSidebarProps {
  collectionTags: TagSummary[]
  descriptorTags: TagSummary[]
  colorCodeSummaries: ColorCodeSummary[]
  colorCountSummaries: ColorCountSummary[]
  sizeSummaries: SizeSummary[]
  filterState: FilterState
  sortKey: SortKey
  priceStats: PriceStats
  filtersAreActive: boolean
  onToggleTag: (tag: string) => void
  onToggleColorCode: (code: string) => void
  onToggleColorCount: (value: string) => void
  onToggleSize: (value: string) => void
  onToggleAvailability: () => void
  onToggleFavorites: () => void
  onPriceChange: (index: 0 | 1, value: number) => void
  onSearchChange: (value: string) => void
  onSortChange: (value: SortKey) => void
  onClearFilters: () => void
  onShareFilters?: () => void
  shareStatus?: 'idle' | 'copied' | 'error'
  searchInputRef?: RefObject<HTMLInputElement>
  managedCategories?: CategorySidebarNode[]
  favoritesEnabled?: boolean
  onClose?: () => void
}

const sectionTitleClasses =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-700'

const chipClasses = (active: boolean) =>
  [
    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors duration-200',
    active
      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
      : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
  ].join(' ')

const listTagClasses = (active: boolean) =>
  [
    'w-full rounded-md border border-transparent px-3 py-2 text-left text-[12px] tracking-[0.05em] transition-colors duration-150',
    active
      ? 'border-neutral-900 bg-neutral-50 text-neutral-900 font-semibold'
      : 'text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
  ].join(' ')

const squareButtonClasses = (active: boolean) =>
  [
    'min-w-[60px] rounded-md border px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.05em] transition-colors duration-200',
    active
      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
      : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
  ].join(' ')

const SidebarChevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 16 10"
    className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
    aria-hidden="true"
  >
    <path
      d="m2 2.5 6 5 6-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const FilterSidebar = ({
  collectionTags,
  descriptorTags,
  colorCodeSummaries,
  colorCountSummaries,
  sizeSummaries,
  filterState,
  sortKey,
  priceStats,
  filtersAreActive,
  onToggleTag,
  onToggleColorCode,
  onToggleColorCount,
  onToggleSize,
  onToggleAvailability,
  onToggleFavorites,
  onPriceChange,
  onSearchChange,
  onSortChange,
  onClearFilters,
  onShareFilters,
  shareStatus = 'idle',
  searchInputRef,
  managedCategories = [],
  favoritesEnabled = false,
  onClose
}: FilterSidebarProps) => {
  const canShare = Boolean(onShareFilters)
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({})

  const toggleNode = (id: string) =>
    setOpenNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))

  const managedTree = useMemo(() => managedCategories, [managedCategories])
  const hasManagedCategories = managedTree.length > 0
  const showCollectionFallback = !hasManagedCategories && collectionTags.length > 0

  const renderManagedCategories = (nodes: CategorySidebarNode[], depth = 0): JSX.Element[] =>
    nodes.map(node => {
      const hasChildren = node.children.length > 0
      const isOpen = openNodes[node.id] ?? false
      const isSelectable = Boolean(node.tagKey)
      const isActive = node.tagKey ? filterState.tags.includes(node.tagKey) : false
      return (
        <div key={node.id} className="space-y-1">
          <button
            type="button"
            onClick={() => {
              if (hasChildren && !node.tagKey) {
                toggleNode(node.id)
                return
              }
              if (node.tagKey) {
                onToggleTag(node.tagKey)
              }
            }}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[11px] tracking-[0.15em] transition ${
              depth === 0 ? 'bg-neutral-50 text-neutral-700 font-semibold' : 'text-neutral-600'
            } ${
              isSelectable && isActive
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
            } ${!isSelectable && !hasChildren ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span className="flex-1">{node.name}</span>
            {hasChildren ? (
              <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-500">
                <SidebarChevron open={isOpen} />
              </span>
            ) : null}
          </button>
          {hasChildren && isOpen ? (
            <div className="space-y-1 border-l border-neutral-200 pl-3">
              {renderManagedCategories(node.children, depth + 1)}
            </div>
          ) : null}
        </div>
      )
    })

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 bg-neutral-900 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition hover:bg-neutral-800 hover:border-neutral-800"
        >
          Ocultar
        </button>
      </div>
      <header className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className={sectionTitleClasses}>Filtrar</p>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              {'Búsqueda semántica y filtros combinables por colores, tallas y disponibilidad.'}
            </p>
            <input
              type="search"
              value={filterState.search}
              ref={searchInputRef}
              onChange={event => onSearchChange(event.target.value)}
              placeholder="Buscar por nombre, descripcion o alias"
              className="w-full rounded-xl border border-neutral-200/80 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-0"
            />
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
              {filtersAreActive && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="transition hover:text-neutral-900"
                >
                  Limpiar filtros
                </button>
              )}
          {canShare && (
            <button
              type="button"
              onClick={onShareFilters}
              className="transition hover:text-neutral-900"
            >
              {shareStatus === 'copied'
                ? 'Enlace copiado'
                : shareStatus === 'error'
                  ? 'Error al copiar'
                  : 'Copiar enlace'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onToggleAvailability}
            className={squareButtonClasses(filterState.onlyAvailable)}
          >
            Solo disponibles
          </button>
          <button
            type="button"
            onClick={onToggleFavorites}
            className={squareButtonClasses(favoritesEnabled)}
          >
            Favoritos
          </button>
        </div>
      </header>

          {hasManagedCategories && (
            <section className="space-y-3">
              <p className={sectionTitleClasses}>Categorías personalizadas</p>
              <div className="space-y-1.5">{renderManagedCategories(managedTree)}</div>
            </section>
          )}

          <div className="space-y-6">
            <section className="space-y-3">
              <p className={sectionTitleClasses}>{'Rango de precio (€)'}</p>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <input
                  type="number"
                  min={priceStats.min}
                  max={priceStats.max}
                  value={filterState.priceRange[0]}
                  onChange={event => onPriceChange(0, Number(event.target.value))}
                  className="w-full rounded-lg border border-neutral-200/80 px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-0"
                />
                <span className="text-[11px] uppercase tracking-[0.15em] text-neutral-400">{'€'}</span>
                <input
                  type="number"
                  min={priceStats.min}
                  max={priceStats.max}
                  value={filterState.priceRange[1]}
                  onChange={event => onPriceChange(1, Number(event.target.value))}
                  className="w-full rounded-lg border border-neutral-200/80 px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-0"
                />
              </div>
            </section>

            <section className="space-y-3">
              <p className={sectionTitleClasses}>Disponibilidad</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={onToggleAvailability}
                  className={listTagClasses(filterState.onlyAvailable)}
                >
                  {'Solo con galería'}
                </button>
                <button
                  type="button"
                  onClick={onToggleFavorites}
                  className={listTagClasses(favoritesEnabled)}
                >
                  {'Solo favoritos guardados'}
                </button>
              </div>
            </section>

            {sizeSummaries.length > 0 && (
              <section className="space-y-3">
                <p className={sectionTitleClasses}>Tallas activas</p>
                <div className="space-y-1.5">
                  {sizeSummaries.map(size => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => onToggleSize(size.value)}
                      className={listTagClasses(filterState.sizes.includes(size.value))}
                    >
                      {size.value}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {colorCountSummaries.length > 0 && (
              <section className="space-y-3">
                <p className={sectionTitleClasses}>{'Número de colores'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {colorCountSummaries.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onToggleColorCount(option.value)}
                      className={chipClasses(filterState.colorCounts.includes(option.value))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {colorCodeSummaries.length > 0 && (
              <section className="space-y-3">
                <p className={sectionTitleClasses}>{'Paleta (códigos)'}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {colorCodeSummaries.map(option => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => onToggleColorCode(option.code)}
                      className={squareButtonClasses(filterState.colorCodes.includes(option.code))}
                    >
                      {option.code}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {showCollectionFallback && (
              <section className="space-y-3">
                <p className={sectionTitleClasses}>Colecciones</p>
                <div className="space-y-1.5">
                  {collectionTags.map(tag => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => onToggleTag(tag.label)}
                      className={listTagClasses(filterState.tags.includes(tag.label))}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {descriptorTags.length > 0 && (
              <section className="space-y-3">
                <p className={sectionTitleClasses}>Atributos / patrones</p>
                <div className="space-y-1.5">
                  {descriptorTags.map(tag => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => onToggleTag(tag.label)}
                      className={listTagClasses(filterState.tags.includes(tag.label))}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

      <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
        Ordenar
        <select
          value={sortKey}
          onChange={event => onSortChange(event.target.value as SortKey)}
          className="rounded-lg border border-neutral-200/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-600 focus:border-neutral-900 focus:outline-none focus:ring-0"
        >
          <option value="priority">Orden manual</option>
          <option value="name">Nombre</option>
          <option value="price">Precio</option>
          <option value="views">Popularidad</option>
        </select>
      </div>
    </div>
  )
}
