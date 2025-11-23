import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllProducts } from '@/lib/products'
import { ProductPerformancePanel } from '@/components/admin/ProductPerformancePanel'
import { LoginForm } from '@/components/admin/LoginForm'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'
import { DEFAULT_PRODUCT_TYPE } from '@/lib/productTypes'
import type { AdminProductFormValues } from '@/types/admin'

export const dynamic = 'force-dynamic'

export default async function AdminStatsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return (
            <div className="mx-auto flex min-h-screen max-w-6xl 3xl:max-w-8xl items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
                <LoginForm />
            </div>
        )
    }

    const priorityOf = (value?: number) =>
        typeof value === 'number' ? value : DEFAULT_PRODUCT_PRIORITY

    const productsRaw = await getAllProducts()

    const products: AdminProductFormValues[] = productsRaw.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category ?? '',
        type: product.type ?? DEFAULT_PRODUCT_TYPE,
        color: product.color ?? '',
        price: product.price,
        tags: product.tags ?? [],
        sizes: product.sizes ?? [],
        available: product.available ?? product.photos > 0,
        gallery: product.gallery ?? [],
        priority: priorityOf(product.priority),
        metadata: product.metadata ?? {},
        viewCount: product.viewCount ?? 0
    }))

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-neutral-900">Estadísticas</h1>
                <Link
                    href="/admin"
                    className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                >
                    Volver al panel
                </Link>
            </div>

            <ProductPerformancePanel products={products} />
        </div>
    )
}
