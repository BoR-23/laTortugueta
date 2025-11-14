import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { readCategories } from '@/lib/categories'
import { LoginForm } from '@/components/admin/LoginForm'
import { CategoryManager } from '@/components/admin/CategoryManager'
import type { CategoryDTO } from '@/types/categories'

export const dynamic = 'force-dynamic'

const mapToDTO = (records: Awaited<ReturnType<typeof readCategories>>): CategoryDTO[] =>
  records.map(record => ({
    id: record.id,
    scope: record.scope,
    name: record.name,
    tagKey: record.tagKey,
    parentId: record.parentId,
    order: record.order
  }))

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl 3xl:max-w-8xl items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <LoginForm />
      </div>
    )
  }

  const categories = await readCategories()

  return (
    <div className="mx-auto max-w-6xl 3xl:max-w-8xl px-4 py-12 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-semibold text-neutral-900">Gestión de categorías</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Ordena, renombra y agrupa las categorías que alimentan el menú principal y el panel de filtros.
        </p>
      </div>

      <CategoryManager initialCategories={mapToDTO(categories)} />
    </div>
  )
}
