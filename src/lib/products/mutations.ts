import { createSupabaseServerClient } from '../supabaseClient'

import { canUseSupabase, clearProductCaches } from './cache'
import {
  sanitiseProductInput,
  supabasePayloadFromInput,
  normalisePriority,
  buildProductFromSupabase
} from './builders'
import type { MediaAssetInput, ProductMutationInput, ProductPriorityUpdate } from './types'

const ensureSupabaseAvailable = () => {
  if (!canUseSupabase) {
    throw new Error(
      'La gestión de productos requiere Supabase configurado. Define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
}

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

  ensureSupabaseAvailable()
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

  clearProductCaches()
}

export const createProductRecord = async (input: ProductMutationInput) => {
  const payload = sanitiseProductInput(input)

  if (!payload.id) {
    throw new Error('El identificador es obligatorio.')
  }

  if (!payload.name) {
    throw new Error('El nombre es obligatorio.')
  }

  ensureSupabaseAvailable()
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

  clearProductCaches()
  return buildProductFromSupabase(data)
}

export const updateProductRecord = async (id: string, input: ProductMutationInput) => {
  const payload = sanitiseProductInput({ ...input, id })

  ensureSupabaseAvailable()
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

  clearProductCaches()
  return buildProductFromSupabase(data)
}

export const deleteProductRecord = async (id: string) => {
  ensureSupabaseAvailable()
  const client = createSupabaseServerClient()
  const { error } = await client.from('products').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
  clearProductCaches()
}

export const replaceProductMediaAssets = async (
  productId: string,
  assets: MediaAssetInput[]
) => {
  ensureSupabaseAvailable()
  const client = createSupabaseServerClient()
  await client.from('media_assets').delete().eq('product_id', productId)

  const validAssets = assets
    .map((asset, index) => {
      const rawPosition =
        typeof asset.position === 'number' ? asset.position : Number(asset.position ?? '')
      return {
        product_id: productId,
        url: asset.url,
        position: Number.isFinite(rawPosition) ? rawPosition : index
      }
    })
    .filter(asset => Boolean(asset.url))

  if (validAssets.length > 0) {
    const { error } = await client.from('media_assets').insert(validAssets)
    if (error) {
      throw new Error(error.message)
    }
  }

  clearProductCaches()
}
