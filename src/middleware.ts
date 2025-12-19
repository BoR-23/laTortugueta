import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = url.hostname
    const pathname = url.pathname

    // 1. Redirect www to non-www
    if (hostname.startsWith('www.')) {
        url.hostname = hostname.replace('www.', '')
        return NextResponse.redirect(url, 301)
    }

    // 2. Protect /admin/* routes (except /admin login page)
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
    matcher: [
        /*
         * Match all request paths except for API routes, static files, etc.
         * This covers both www redirect and admin protection
         */
        '/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)',
    ],
}
