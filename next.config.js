/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**'
  },
  {
    protocol: 'https',
    hostname: 'pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev',
    pathname: '/**'
  }
]

if (supabaseUrl) {
  try {
    const { host } = new URL(supabaseUrl)
    if (host && !host.endsWith('.supabase.co')) {
      remotePatterns.push({
        protocol: 'https',
        hostname: host,
        pathname: '/**'
      })
    }
  } catch {
    // ignore invalid env format
  }
}

const nextConfig = {
  experimental: {
    serverViewTransitions: true
  },
  images: {
    remotePatterns
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*)\.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=()' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
