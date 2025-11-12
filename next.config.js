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
  images: {
    remotePatterns
  }
}

module.exports = nextConfig
