'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

import { CACHE_TAGS } from './cacheTags'

const HOME_PATHS = ['/', '/ca', '/en']

const revalidateHomePaths = () => {
  HOME_PATHS.forEach(path => revalidatePath(path))
}

export const revalidateProduct = async (productId?: string) => {
  revalidateTag(CACHE_TAGS.products)
  revalidateHomePaths()
  if (productId) {
    revalidatePath(`/${productId}`)
  }
  revalidatePath('/admin')
}

export const revalidateCatalog = async () => {
  revalidateTag(CACHE_TAGS.products)
  revalidateTag(CACHE_TAGS.categories)
  revalidateTag(CACHE_TAGS.siteSettings)
  revalidateTag(CACHE_TAGS.heroSlides)
  revalidateHomePaths()
  revalidatePath('/admin')
}
