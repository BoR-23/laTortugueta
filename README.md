# La Tortugueta - E-commerce & Admin Platform

A modern, high-performance e-commerce platform for "Calcetines Tradicionales" (Traditional Socks), built with Next.js 14, Supabase, and Tailwind CSS.

## 🚀 Features

### Public Storefront
- **High Performance**: Optimized for Core Web Vitals (Lighthouse 100).
- **SEO Optimized**: Dynamic metadata, JSON-LD structured data, and canonical URL management.
- **Responsive Design**: Mobile-first approach with optimized image loading (`next/image` with R2 storage).
- **Product Catalog**: Filterable grid with detailed product pages.

### Admin Dashboard (`/admin`)
- **Sales Management**:
    - View, edit, and delete orders.
    - **Wholesale Toggle**: Switch orders between Retail and Wholesale (50% price) with a single click.
    - **Visual Grouping**: Orders are color-coded for easy distinction.
    - **CSV Import**: Bulk import orders from Excel/CSV.
- **Product Management**:
    - Create, edit, and delete products.
    - **Image Upload**: Drag-and-drop upload to Cloudflare R2 with auto-resizing (1200x630 for SEO).
    - **SEO Preview**: Real-time Google snippet preview for product pages.
- **Site Settings**:
    - Manage global site metadata (Title, Description).
    - **Favicon Manager**: Upload and sync favicons between Admin and Public site.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📦 Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd latortugueta
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file with the following keys:
    ```env
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

4.  **Run Local Server**:
    ```bash
    npm run dev
    ```

## 🗄 Database Schema

### `sales` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `order_id` | text | Order identifier |
| `product_name` | text | Name of the product |
| `product_price` | numeric | Price of the item |
| `is_wholesale` | boolean | **New**: True if wholesale price applied |
| ... | ... | ... |

> **Note**: If you encounter errors updating sales, ensure the `is_wholesale` and `product_price` columns exist.
> Run this SQL in Supabase:
> ```sql
> ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT FALSE;
> ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_price NUMERIC;
> ```

## 🚢 Deployment

The project is optimized for deployment on **Vercel** or **Netlify**.
Ensure all environment variables are set in the deployment dashboard.

---

Built with ❤️ for La Tortugueta.
