import { createSupabaseServerClient } from './supabaseClient'
import { cache } from 'react'

export interface HeroSlide {
    id: string
    image_url: string
    title: string
    subtitle: string
    cta_text: string
    cta_link: string
    priority: number
    active: boolean
}

export const getHeroSlides = cache(async (): Promise<HeroSlide[]> => {
    const client = createSupabaseServerClient()

    const { data, error } = await client
        .from('hero_slides')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching hero slides:', error)
        return []
    }

    return data as HeroSlide[]
})
