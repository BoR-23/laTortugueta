import fs from 'fs/promises'
import path from 'path'
import { canUseSupabase, clearProductCaches, invalidateProductDataCache } from './products'
import { createSupabaseServerClient } from './supabaseClient'
import { revalidatePath } from 'next/cache'

const pricingFilePath = path.join(process.cwd(), 'data/pricing.json')

const readPricingFile = async () => {
  try {
    const raw = await fs.readFile(pricingFilePath, 'utf8')
    return JSON.parse(raw) as Record<string, number>
  } catch (error) {
    return {}
  }
}

const persistPricingFile = async (data: Record<string, number>) => {
  const serialized = JSON.stringify(data, null, 2)
  await fs.writeFile(pricingFilePath, serialized, 'utf8')
}

const getPricingFromSupabase = async () => {
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
  if (canUseSupabase) {
    return getPricingFromSupabase()
  }
  return readPricingFile()
}

export const updateProductPrice = async (productId: string, price: number) => {
  if (canUseSupabase) {
    const client = createSupabaseServerClient()
    const { error } = await client
      .from('products')
      .update({ price, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (error) {
      throw new Error(error.message)
    }

    clearProductCaches()
    invalidateProductDataCache()
    revalidatePath('/')
    revalidatePath(`/${productId}`)
    revalidatePath('/admin')

    return getPricingFromSupabase()
  }

  const pricing = await readPricingFile()
  pricing[productId] = price
  await persistPricingFile(pricing)

  clearProductCaches()
  invalidateProductDataCache()
  revalidatePath('/')
  revalidatePath(`/${productId}`)
  revalidatePath('/admin')

  return pricing
}
