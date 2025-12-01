import { cache } from 'react'

import { createSupabaseServerClient, supabaseBrowserClient } from './supabaseClient'

export type SiteSettings = {
  enableTopVisited: boolean
  enableTestimonials: boolean
  enableStoryHighlights: boolean
  enableLocalSuggestions: boolean
  enableCatalogBadges: boolean
  seo_title?: string
  seo_description?: string
  seo_og_image?: string
}

const DEFAULT_SETTINGS: SiteSettings = {
  enableTopVisited: true,
  enableTestimonials: true,
  enableStoryHighlights: true,
  enableLocalSuggestions: true,
  enableCatalogBadges: true
}

const SETTINGS_KEY = 'site_default'

type RawSetting = {
  key: string
  value: Partial<SiteSettings>
}

const mergeSettings = (raw?: Partial<SiteSettings>): SiteSettings => ({
  ...DEFAULT_SETTINGS,
  ...raw
})

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const client = createSupabaseServerClient()
    const { data, error } = await client
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single()

    if (error || !data) {
      return DEFAULT_SETTINGS
    }

    const payload = data as RawSetting
    return mergeSettings(payload.value)
  } catch (error) {
    console.warn('[settings] falling back to defaults', error)
    return DEFAULT_SETTINGS
  }
})

export const updateSiteSettings = async (partial: Partial<SiteSettings>) => {
  const client = createSupabaseServerClient()

  // Get current settings first
  const current = await getSiteSettings()

  // Merge current settings with the partial update
  const merged = {
    ...current,
    ...partial
  }

  const { error } = await client.from('site_settings').upsert(
    {
      key: SETTINGS_KEY,
      value: merged,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'key' }
  )
  if (error) {
    throw error
  }
  return merged
}

export const getClientSiteSettings = async (): Promise<SiteSettings> => {
  if (!supabaseBrowserClient) {
    return DEFAULT_SETTINGS
  }
  const { data } = await supabaseBrowserClient
    .from('site_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .single()
  if (!data) {
    return DEFAULT_SETTINGS
  }
  const payload = data as RawSetting
  return mergeSettings(payload.value)
}

export const SITE_SETTINGS_DEFAULTS = DEFAULT_SETTINGS
