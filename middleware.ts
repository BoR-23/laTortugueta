import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir el login en /admin sin sesión; proteger lo demás bajo /admin/**
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  if (pathname === '/admin') {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token as any).role !== 'admin') {
    const redirectUrl = new URL('/admin', req.url)
    redirectUrl.searchParams.set('error', 'auth')
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
