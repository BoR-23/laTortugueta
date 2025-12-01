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
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'framer-motion']
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

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

module.exports = withPWA(nextConfig)
