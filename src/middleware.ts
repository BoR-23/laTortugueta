import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Only protect /admin/* routes (except /admin login page)
    if (pathname.startsWith('/admin') && pathname !== '/admin') {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
        if (!token || (token as any).role !== 'admin') {
            const redirectUrl = new URL('/admin', request.url)
            redirectUrl.searchParams.set('error', 'auth')
            return NextResponse.redirect(redirectUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    // ONLY match admin routes - do NOT intercept product pages
    matcher: ['/admin/:path*'],
}
