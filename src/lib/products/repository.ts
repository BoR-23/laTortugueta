import fs from 'fs'
import path from 'path'
import { cache } from 'react'

import { createSupabaseServerClient } from '../supabaseClient'
import { getCategories } from '../categories'

import { buildProductFromMarkdown, buildProductFromSupabase, compareByPriority } from './builders'
import { canUseSupabase, productsDirectory } from './cache'
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

const getSupabaseProducts = async () => {
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

  return data.map(record => buildProductFromSupabase(record, lookup)).sort(compareByPriority)
}

const getSupabaseProductById = async (id: string) => {
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

export async function getAllProductIds() {
  if (canUseSupabase) {
    const client = createSupabaseServerClient()
    const { data } = await client.from('products').select('id')
    if (data) {
      return data.map(row => ({ params: { id: row.id } }))
    }
  }

  const fileNames = fs.readdirSync(productsDirectory)
  return fileNames.map(fileName => ({
    params: { id: fileName.replace(/\.md$/, '') }
  }))
}

const fetchProductFromSource = async (id: string): Promise<Product> => {
  if (canUseSupabase) {
    return await getSupabaseProductById(id)
  }

  const fullPath = path.join(productsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  return buildProductFromMarkdown(id, fileContents)
}

const fetchAllProductsFromSource = async (): Promise<Product[]> => {
  if (canUseSupabase) {
    return await getSupabaseProducts()
  }

  const fileNames = fs.readdirSync(productsDirectory)
  const products = fileNames.map(fileName => {
    const id = fileName.replace(/\.md$/, '')
    const fullPath = path.join(productsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    return buildProductFromMarkdown(id, fileContents)
  })

  return products.sort(compareByPriority)
}

let memoizedGetProduct = cache(fetchProductFromSource)
let memoizedGetAllProducts = cache(fetchAllProductsFromSource)

export const invalidateProductDataCache = () => {
  memoizedGetProduct = cache(fetchProductFromSource)
  memoizedGetAllProducts = cache(fetchAllProductsFromSource)
}

export async function getProductData(id: string): Promise<Product> {
  return memoizedGetProduct(id)
}

export async function getAllProducts(): Promise<Product[]> {
  return memoizedGetAllProducts()
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  const allProducts = await getAllProducts()
  return allProducts.filter(product => product.tags.includes(tag))
}

export async function getProductsByType(type: string): Promise<Product[]> {
  const allProducts = await getAllProducts()
  return allProducts.filter(product =>
    product.type.toLowerCase().includes(type.toLowerCase())
  )
}
