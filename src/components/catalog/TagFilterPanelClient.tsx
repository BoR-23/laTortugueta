'use client'

import dynamic from 'next/dynamic'

import { CatalogPanelSkeleton } from '@/components/catalog/CatalogPanelSkeleton'
import type { CatalogProductSummary } from '@/components/catalog/prepareCatalogProducts'
import type { CategoryDTO } from '@/types/categories'

const LazyTagFilterPanel = dynamic(
  () =>
    import('@/components/catalog/TagFilterPanel').then(mod => ({
      default: mod.TagFilterPanel
    })),
  {
    ssr: false,
    loading: () => <CatalogPanelSkeleton />
  }
)

interface TagFilterPanelClientProps {
  products: CatalogProductSummary[]
  headerCategories: CategoryDTO[]
  filterCategories: CategoryDTO[]
}

export function TagFilterPanelClient({
  products,
  headerCategories,
  filterCategories
}: TagFilterPanelClientProps) {
  return (
    <LazyTagFilterPanel
      products={products}
      headerCategories={headerCategories}
      filterCategories={filterCategories}
    />
  )
}
