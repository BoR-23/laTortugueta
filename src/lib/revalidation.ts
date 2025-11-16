'use server'

import { revalidatePath } from 'next/cache'

export const revalidateProduct = async (productId?: string) => {
  revalidatePath('/')
  if (productId) {
    revalidatePath(`/${productId}`)
  }
  revalidatePath('/admin')
}

export const revalidateCatalog = async () => {
  revalidatePath('/')
  revalidatePath('/admin')
}
