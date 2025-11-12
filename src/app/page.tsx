import { getAllProducts } from "@/lib/products"
import { TagFilterPanelClient } from "@/components/catalog/TagFilterPanelClient"
import { prepareCatalogProducts } from "@/components/catalog/prepareCatalogProducts"
import { getCategories } from "@/lib/categories"

const mapCategoriesToDTO = (records: Awaited<ReturnType<typeof getCategories>>) =>
  records.map(record => ({
    id: record.id,
    scope: record.scope,
    name: record.name,
    tagKey: record.tagKey,
    parentId: record.parentId,
    order: record.order
  }))

const buildCategoryNameMap = (records: Awaited<ReturnType<typeof getCategories>>) => {
  const map = new Map<string, string>()
  records.forEach(record => {
    if (record.tagKey) {
      map.set(record.tagKey.toLowerCase(), record.name)
    }
  })
  return map
}

export default async function Home() {
  const products = await getAllProducts()
  const catalogProducts = prepareCatalogProducts(products)
  const [headerCategories, filterCategories] = await Promise.all([
    getCategories("header"),
    getCategories("filter")
  ])

  const headerNameMap = buildCategoryNameMap(headerCategories)
  const filterNameMap = buildCategoryNameMap(filterCategories)

  const enrichedProducts = catalogProducts.map(product => {
    const normalizedTags = (product.tags ?? []).map(tag => tag.toLowerCase())
    const match = normalizedTags.find(tag => filterNameMap.has(tag) || headerNameMap.has(tag))
    const displayName = match ? filterNameMap.get(match) ?? headerNameMap.get(match) : null
    return {
      ...product,
      category: displayName ?? product.category
    }
  })

  return (
    <TagFilterPanelClient
      products={enrichedProducts}
      headerCategories={mapCategoriesToDTO(headerCategories)}
      filterCategories={mapCategoriesToDTO(filterCategories)}
    />
  )
}
