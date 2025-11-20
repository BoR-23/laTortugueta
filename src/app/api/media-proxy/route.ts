import { NextResponse } from 'next/server'

const allowedPrefix = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('url')
  if (!target) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    // Restringimos a nuestro dominio de media público si está definido
    if (allowedPrefix && !target.startsWith(allowedPrefix)) {
      return NextResponse.json({ error: 'URL no permitida' }, { status: 400 })
    }

    const upstream = await fetch(target)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const filename = target.split('/').pop() || 'imagen'

    return new NextResponse(upstream.body as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0'
      }
    })
  } catch (error) {
    console.error('media-proxy error:', error)
    return NextResponse.json({ error: 'Error al descargar' }, { status: 500 })
  }
}
