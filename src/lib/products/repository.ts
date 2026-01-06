import { cache } from 'react'

import { createSupabaseServerClient } from '../supabaseClient'
import { getCategories } from '../categories'

import { buildProductFromSupabase, compareByPriority } from './builders'
import type { Product } from './types'

const buildCategoryLookup = async () => {
  const categories = await getCategories()
  const lookup = new Map<string, string>()
  categories.forEach(category => {
    if (category.tagKey) {
      lookup.set(category.tagKey, category.name)
    }
  })
  return lookup
}

const mapRecords = (records: Record<string, any>[], lookup: Map<string, string>): Product[] =>
  records.map(record => {
    const p = buildProductFromSupabase(record, lookup)
    // OPTIMIZATION: Strip heavy fields for list views to prevent HTML bloat
    // This reduces the payload size significantly by removing unused data in the catalog
    p.metadata = undefined
    p.description = ''
    p.content = ''
    // We only need the first image for the grid
    if (p.gallery && p.gallery.length > 1) {
      p.gallery = [p.gallery[0]]
    }
    return p
  })

const fetchAllProductsFromSupabase = async () => {
  const client = createSupabaseServerClient()
  const [lookup, result] = await Promise.all([
    buildCategoryLookup(),
    client
      .from('products')
      .select('*, media_assets(*)')
      .order('priority', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
  ])
  const { data, error } = result

  if (error || !data) {
    throw error || new Error('Supabase returned no data')
  }

  return mapRecords(data, lookup).sort(compareByPriority)
}

const fetchProductByIdFromSupabase = async (id: string) => {
  const client = createSupabaseServerClient()
  const [lookup, result] = await Promise.all([
    buildCategoryLookup(),
    client.from('products').select('*, media_assets(*)').eq('id', id).single()
  ])
  const { data, error } = result

  if (error || !data) {
    throw error || new Error('Product not found')
  }

  return buildProductFromSupabase(data, lookup)
}

const fetchProductsByTagFromSupabase = async (tag: string) => {
  const client = createSupabaseServerClient()

  // 1. Find products that have images with this tag
  const { data: mediaMatches } = await client
    .from('media_assets')
    .select('product_id')
    .contains('tags', [tag])

  const mediaProductIds = Array.from(new Set(mediaMatches?.map((m: any) => m.product_id) || []))

  let query = client.from('products').select('*, media_assets(*)')

  if (mediaProductIds.length > 0) {
    // OR condition: product has tag OR id is in mediaProductIds
    // We construct the filter string for Supabase .or()
    // Format: tags.cs.{tag},id.in.(id1,id2)
    const safeTag = tag.replace(/"/g, '\\"')
    const idsStr = mediaProductIds.join(',')
    query = query.or(`tags.cs.{"${safeTag}"},id.in.(${idsStr})`)
  } else {
    query = query.contains('tags', [tag])
  }

  const [lookup, result] = await Promise.all([
    buildCategoryLookup(),
    query
      .order('priority', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
  ])
  const { data, error } = result

  if (error || !data) {
    throw error || new Error('Supabase returned no data')
  }

  return mapRecords(data, lookup)
}

const fetchProductsByTypeFromSupabase = async (type: string) => {
  const client = createSupabaseServerClient()
  const pattern = `%${type}%`
  const [lookup, result] = await Promise.all([
    buildCategoryLookup(),
    client
      .from('products')
      .select('*, media_assets(*)')
      .ilike('type', pattern)
      .order('priority', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
  ])
  const { data, error } = result

  if (error || !data) {
    throw error || new Error('Supabase returned no data')
  }

  return mapRecords(data, lookup)
}

let memoizedGetProduct = cache(fetchProductByIdFromSupabase)
let memoizedGetAllProducts = cache(fetchAllProductsFromSupabase)

export const invalidateProductDataCache = () => {
  memoizedGetProduct = cache(fetchProductByIdFromSupabase)
  memoizedGetAllProducts = cache(fetchAllProductsFromSupabase)
}

export async function getProductData(id: string): Promise<Product> {
  return memoizedGetProduct(id)
}

export async function getAllProducts(): Promise<Product[]> {
  return memoizedGetAllProducts()
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  return fetchProductsByTagFromSupabase(tag)
}

export async function getProductsByType(type: string): Promise<Product[]> {
  return fetchProductsByTypeFromSupabase(type.toLowerCase())
}

export async function getAllProductIds() {
  const client = createSupabaseServerClient()
  const { data, error } = await client.from('products').select('id')
  if (error || !data) {
    throw error || new Error('Supabase returned no ids')
  }
  return data.map(row => ({ params: { id: row.id } }))
}
