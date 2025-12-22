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
    mobile_crop?: {
        x: number  // horizontal center position (0-100%)
        y: number  // vertical center position (0-100%)
        size: number  // crop size as percentage (0-100%)
    }
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

    return (data as any[]).map(slide => ({
        id: slide.id,
        image_url: slide.image_url,
        title: slide.title,
        subtitle: slide.subtitle,
        cta_text: slide.cta_text,
        cta_link: slide.cta_link,
        priority: slide.priority,
        active: slide.active,
        mobile_crop: slide.mobile_crop
    }))
})
