'use client'
// Enabling SSR for SEO visibility

import dynamic from 'next/dynamic'

import { CatalogPanelSkeleton } from '@/components/catalog/CatalogPanelSkeleton'
import type { CatalogProductSummary } from '@/components/catalog/prepareCatalogProducts'
import type { CategoryDTO } from '@/types/categories'
import type { SiteSettings } from '@/lib/settings'

import { TagFilterPanel } from '@/components/catalog/TagFilterPanel'

interface TagFilterPanelClientProps {
  products: CatalogProductSummary[]
  headerCategories: CategoryDTO[]
  filterCategories: CategoryDTO[]
  settings: SiteSettings
}

export function TagFilterPanelClient({
  products,
  headerCategories,
  filterCategories,
  settings
}: TagFilterPanelClientProps) {
  return (
    <TagFilterPanel
      products={products}
      headerCategories={headerCategories}
      filterCategories={filterCategories}
      showPopularityBadges={settings.enableCatalogBadges}
    />
  )
}
