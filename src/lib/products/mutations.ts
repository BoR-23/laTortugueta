import { createSupabaseServerClient } from '../supabaseClient'

import {
  sanitiseProductInput,
  supabasePayloadFromInput,
  normalisePriority,
  buildProductFromSupabase
} from './builders'
import { invalidateProductDataCache } from './repository'
import type { MediaAssetInput, ProductMutationInput, ProductPriorityUpdate } from './types'

export const updateProductPriorities = async (updates: ProductPriorityUpdate[]) => {
  const sanitised = updates
    .map(update => ({
      id: String(update.id ?? '').trim(),
      priority: normalisePriority(update.priority)
    }))
    .filter(update => update.id.length > 0)

  if (sanitised.length === 0) {
    return
  }

  const client = createSupabaseServerClient()
  const now = new Date().toISOString()
  const { error } = await client
    .from('products')
    .upsert(
      sanitised.map(update => ({
        id: update.id,
        priority: update.priority,
        updated_at: now
      }))
    )

  if (error) {
    throw new Error(error.message)
  }

  invalidateProductDataCache()
}

export const createProductRecord = async (input: ProductMutationInput) => {
  const payload = sanitiseProductInput(input)

  if (!payload.id) {
    throw new Error('El identificador es obligatorio.')
  }

  if (!payload.name) {
    throw new Error('El nombre es obligatorio.')
  }

  const client = createSupabaseServerClient()
  const supabasePayload = supabasePayloadFromInput(payload)
  supabasePayload.created_at = new Date().toISOString()
  const { data, error } = await client
    .from('products')
    .insert(supabasePayload)
    .select('*, media_assets(*)')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el producto.')
  }

  invalidateProductDataCache()
  return buildProductFromSupabase(data)
}

export const updateProductRecord = async (id: string, input: ProductMutationInput) => {
  const payload = sanitiseProductInput({ ...input, id })

  const client = createSupabaseServerClient()
  const supabasePayload = supabasePayloadFromInput(payload)
  const { data, error } = await client
    .from('products')
    .update(supabasePayload)
    .eq('id', id)
    .select('*, media_assets(*)')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo actualizar el producto.')
  }

  invalidateProductDataCache()
  return buildProductFromSupabase(data)
}

export const deleteProductRecord = async (id: string) => {
  const client = createSupabaseServerClient()
  const { error } = await client.from('products').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
  invalidateProductDataCache()
}

export const replaceProductMediaAssets = async (
  productId: string,
  assets: MediaAssetInput[],
  placeholders?: Record<string, string>,
  reviewed?: Record<string, boolean>
) => {
  const client = createSupabaseServerClient()
  const { data: existingAssets } = await client
    .from('media_assets')
    .select('url, tags')
    .eq('product_id', productId)

  const existingTagsMap = new Map<string, string[]>()
  existingAssets?.forEach((asset: any) => {
    if (asset.tags && asset.tags.length > 0) {
      existingTagsMap.set(asset.url, asset.tags)
    }
  })

  await client.from('media_assets').delete().eq('product_id', productId)

  const validAssets = assets
    .map((asset, index) => {
      const rawPosition =
        typeof asset.position === 'number' ? asset.position : Number(asset.position ?? '')

      // Use explicitly provided tags, or fall back to existing tags for this URL
      const tags = asset.tags ?? existingTagsMap.get(asset.url) ?? []

      return {
        product_id: productId,
        url: asset.url,
        position: Number.isFinite(rawPosition) ? rawPosition : index,
        tags
      }
    })
    .filter(asset => Boolean(asset.url))

  if (validAssets.length > 0) {
    const { error } = await client.from('media_assets').insert(validAssets)
    if (error) {
      throw new Error(error.message)
    }
  }

  const urls = new Set(validAssets.map(asset => asset.url))
  const now = new Date().toISOString()
  const { data: productRecord } = await client
    .from('products')
    .select('metadata')
    .eq('id', productId)
    .single()

  const existingMetadata = (productRecord?.metadata ?? {}) as Record<string, any>
  const existingPlaceholders =
    existingMetadata.imagePlaceholders && typeof existingMetadata.imagePlaceholders === 'object'
      ? (existingMetadata.imagePlaceholders as Record<string, string>)
      : {}
  const existingReview =
    existingMetadata.imageReview && typeof existingMetadata.imageReview === 'object'
      ? (existingMetadata.imageReview as Record<string, boolean>)
      : {}

  const filteredPlaceholders: Record<string, string> = {}
  Object.entries(existingPlaceholders).forEach(([url, value]) => {
    if (urls.has(url) && value) {
      filteredPlaceholders[url] = value
    }
  })
  const filteredReview: Record<string, boolean> = {}
  Object.entries(existingReview).forEach(([url, value]) => {
    if (urls.has(url)) {
      filteredReview[url] = Boolean(value)
    }
  })

  if (placeholders) {
    Object.entries(placeholders).forEach(([url, value]) => {
      if (urls.has(url) && value) {
        filteredPlaceholders[url] = value
      }
    })
  }
  if (reviewed) {
    Object.entries(reviewed).forEach(([url, value]) => {
      if (urls.has(url)) {
        filteredReview[url] = Boolean(value)
      }
    })
  }

  existingMetadata.imagePlaceholders = filteredPlaceholders
  existingMetadata.imageReview = filteredReview

  await client
    .from('products')
    .update({ metadata: existingMetadata, updated_at: now })
    .eq('id', productId)

  invalidateProductDataCache()
}

export const updateProductTags = async (productId: string, tags: string[]) => {
  const client = createSupabaseServerClient()
  const cleaned = Array.from(
    new Set(
      tags
        .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(tag => tag.length > 0)
    )
  )

  const now = new Date().toISOString()
  const { error } = await client
    .from('products')
    .update({ tags: cleaned, updated_at: now })
    .eq('id', productId)

  if (error) {
    throw new Error(error.message)
  }

  invalidateProductDataCache()
  return cleaned
}
