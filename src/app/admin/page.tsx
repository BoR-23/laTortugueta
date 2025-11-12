import Link from 'next/link'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { getAllProducts } from '@/lib/products'
import { DEFAULT_PRODUCT_PRIORITY } from '@/lib/productDefaults'
import { DEFAULT_PRODUCT_TYPE } from '@/lib/productTypes'
import { LoginForm } from '@/components/admin/LoginForm'
import { AdminProductWorkspace } from '@/components/admin/AdminProductWorkspace'
import type { AdminProductFormValues } from '@/types/admin'

export const dynamic = 'force-dynamic'

export default async function AdminPricingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <LoginForm />
      </div>
    )
  }

  const priorityOf = (value?: number) =>
    typeof value === 'number' ? value : DEFAULT_PRODUCT_PRIORITY

  const products: AdminProductFormValues[] = (await getAllProducts())
    .map(product => ({
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
      metadata: product.metadata ?? {}
    }))
    .sort((a, b) => {
      const diff = priorityOf(a.priority) - priorityOf(b.priority)
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'es')
    })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-semibold text-neutral-900">Panel de gestión</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Administra el catálogo completo: crea, edita o elimina productos, ajusta precios y controla la visibilidad.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
          <Link
            href="/admin/categories"
            className="rounded-full border border-neutral-900 px-4 py-2 text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
          >
            Gestión de categorías
          </Link>
        </div>
      </div>

      <AdminProductWorkspace initialProducts={products} />
    </div>
  )
}
