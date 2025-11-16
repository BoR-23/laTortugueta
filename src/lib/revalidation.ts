'use server'

import { revalidatePath } from 'next/cache'

export const revalidateProduct = (productId?: string) => {
  revalidatePath('/')
  if (productId) {
    revalidatePath(`/${productId}`)
  }
  revalidatePath('/admin')
}

export const revalidateCatalog = () => {
  revalidatePath('/')
  revalidatePath('/admin')
}
