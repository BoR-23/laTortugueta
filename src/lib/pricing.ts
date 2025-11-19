import { revalidatePath } from 'next/cache'

import { createSupabaseServerClient } from './supabaseClient'
import { invalidateProductDataCache } from './products'

const fetchPricingFromSupabase = async () => {
  const client = createSupabaseServerClient()
  const { data, error } = await client.from('products').select('id, price')
  if (error) {
    throw new Error(error.message)
  }
  const pricing: Record<string, number> = {}
  data?.forEach(entry => {
    pricing[entry.id] = Number(entry.price ?? 0)
  })
  return pricing
}

export const getPricingTable = async () => {
  return fetchPricingFromSupabase()
}

export const updateProductPrice = async (productId: string, price: number) => {
  const client = createSupabaseServerClient()
  const { error } = await client
    .from('products')
    .update({ price, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) {
    throw new Error(error.message)
  }

  invalidateProductDataCache()
  revalidatePath('/')
  revalidatePath(`/${productId}`)
  revalidatePath('/admin')

  return fetchPricingFromSupabase()
}
