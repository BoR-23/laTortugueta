'use client'
// Enabling SSR for SEO visibility

import dynamic from 'next/dynamic'

import { CatalogPanelSkeleton } from '@/components/catalog/CatalogPanelSkeleton'
import type { CatalogProductSummary } from '@/components/catalog/prepareCatalogProducts'
import type { CategoryDTO } from '@/types/categories'
import type { SiteSettings } from '@/lib/settings'

const LazyTagFilterPanel = dynamic(
  () =>
    import('@/components/catalog/TagFilterPanel').then(mod => ({
      default: mod.TagFilterPanel
    })),
  {
    loading: () => <CatalogPanelSkeleton />
  }
)

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
    <LazyTagFilterPanel
      products={products}
      headerCategories={headerCategories}
      filterCategories={filterCategories}
      showPopularityBadges={settings.enableCatalogBadges}
    />
  )
}
