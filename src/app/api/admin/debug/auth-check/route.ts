import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        // Check key env vars (masked)
        const envCheck = {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'DEFINED' : 'MISSING',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINED' : 'MISSING',
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV
        }

        return NextResponse.json({
            status: 'ok',
            session: session ? 'active' : 'null',
            user: session?.user,
            env: envCheck,
            nextAuthVersion: '4.x'
        })
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            env: {
                NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'DEFINED' : 'MISSING',
                NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINED' : 'MISSING'
            }
        }, { status: 500 })
    }
}
