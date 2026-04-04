# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern e-commerce platform for "Calcetines Tradicionales" (Traditional Socks) built with Next.js 14, Supabase, and Tailwind CSS. The platform features both a public storefront and an admin dashboard for managing sales, products, and site settings.

## Key Architecture Components

### Public Storefront
- Built with Next.js 14 App Router
- Responsive design with optimized image loading using `next/image` with Cloudflare R2 storage
- SEO optimized with dynamic metadata, JSON-LD structured data, and canonical URL management
- Product catalog with filterable grid and detailed product pages

### Admin Dashboard (`/admin`)
- Sales management with wholesale toggle functionality (50% price)
- Product management with image upload to Cloudflare R2
- Site settings management including favicon management
- CSV import functionality for bulk order management

### Database
- Uses Supabase (PostgreSQL) for data storage
- Key tables include `sales` with wholesale toggle functionality
- Image assets stored in Cloudflare R2 (S3-compatible)

## Development Setup

### Prerequisites
- Node.js (version specified in package.json)
- Supabase account with database
- Cloudflare R2 account with bucket

### Environment Variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare R2
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-r2-domain.com

# Site URL (for SEO)
NEXT_PUBLIC_SITE_URL=https://latortugueta.com
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run check:data` - Run data health checks
- `npm run verify` - Run data check, lint, and build

## Important Scripts

The repository contains numerous Node.js scripts in the `scripts/` directory for various data management tasks:
- Product import and migration scripts
- Sales data management
- Image asset handling
- Blog migration
- Admin user creation
- SEO and performance monitoring

## File Structure Overview

- `src/` - Main application code
  - `app/` - Next.js App Router pages and components
  - `components/` - Reusable React components
  - `pages/` - Legacy pages (if any)
- `data/` - Static data files including product information, categories, and blog posts
- `scripts/` - Node.js scripts for data management, migration, and maintenance tasks
- `public/` - Static assets

## Testing

Tests are run using Vitest. The test command is `npm run test` or `npm run test:run` for running tests in run mode.

## Deployment

The project is optimized for deployment on Vercel or Netlify. Ensure all environment variables are set in the deployment dashboard.