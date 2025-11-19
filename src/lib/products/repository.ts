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
  records.map(record => buildProductFromSupabase(record, lookup))

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
  const [lookup, result] = await Promise.all([
    buildCategoryLookup(),
    client
      .from('products')
      .select('*, media_assets(*)')
      .contains('tags', [tag])
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
