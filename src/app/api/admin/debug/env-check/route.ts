import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function GET() {
    const diagnostics: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        envVars: {
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? 'SET' : 'MISSING',
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `SET (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10)}...)` : 'MISSING',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
            NETLIFY: process.env.NETLIFY || 'false',
        },
        supabaseTest: null,
        productTest: null,
        error: null,
    }

    // Test Supabase connection
    try {
        const client = createSupabaseServerClient()
        const { data, error } = await client.from('products').select('id').limit(1)

        if (error) {
            diagnostics.supabaseTest = { success: false, error: error.message }
        } else {
            diagnostics.supabaseTest = { success: true, sampleId: data?.[0]?.id || 'no data' }
        }
    } catch (e: any) {
        diagnostics.supabaseTest = { success: false, error: e.message }
    }

    // Test product fetch (same as the page does)
    try {
        const client = createSupabaseServerClient()
        const { data, error } = await client
            .from('products')
            .select('*, media_assets(*)')
            .eq('id', '3-fonts')
            .single()

        if (error) {
            diagnostics.productTest = { success: false, error: error.message }
        } else {
            diagnostics.productTest = {
                success: true,
                productId: data?.id,
                productName: data?.name,
                mediaCount: data?.media_assets?.length || 0
            }
        }
    } catch (e: any) {
        diagnostics.productTest = { success: false, error: e.message }
    }

    return NextResponse.json(diagnostics)
}
