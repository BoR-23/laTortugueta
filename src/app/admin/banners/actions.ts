'use server'

import { createSupabaseServerClient } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'
import { HeroSlide } from '@/lib/banners'

export async function getBanners() {
    const client = createSupabaseServerClient()
    const { data, error } = await client
        .from('hero_slides')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as HeroSlide[]
}

export async function createBanner(formData: FormData) {
    const client = createSupabaseServerClient()

    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const cta_text = formData.get('cta_text') as string
    const cta_link = formData.get('cta_link') as string
    const priority = Number(formData.get('priority') || 0)
    const image_url = formData.get('image_url') as string
    const mobile_crop_str = formData.get('mobile_crop') as string

    if (!image_url) {
        throw new Error('Image URL is required')
    }

    let mobile_crop = { x: 50, y: 50, size: 56 }
    if (mobile_crop_str) {
        try {
            mobile_crop = JSON.parse(mobile_crop_str)
        } catch (e) {
            console.error('Failed to parse mobile_crop', e)
        }
    }

    const { error } = await client.from('hero_slides').insert({
        title,
        subtitle,
        cta_text,
        cta_link,
        priority,
        image_url,
        active: true,
        mobile_crop
    })

    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/admin/banners')
}

export async function updateBanner(id: string, formData: FormData) {
    const client = createSupabaseServerClient()

    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const cta_text = formData.get('cta_text') as string
    const cta_link = formData.get('cta_link') as string
    const priority = Number(formData.get('priority') || 0)
    const active = formData.get('active') === 'true'
    const mobile_crop_str = formData.get('mobile_crop') as string

    const updateData: any = {
        title,
        subtitle,
        cta_text,
        cta_link,
        priority,
        active
    }

    if (mobile_crop_str) {
        try {
            updateData.mobile_crop = JSON.parse(mobile_crop_str)
        } catch (e) {
            console.error('Failed to parse mobile_crop', e)
        }
    }

    const { error } = await client
        .from('hero_slides')
        .update(updateData)
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/admin/banners')
}

export async function deleteBanner(id: string) {
    const client = createSupabaseServerClient()
    const { error } = await client.from('hero_slides').delete().eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/admin/banners')
}
