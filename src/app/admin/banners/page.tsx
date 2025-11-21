import { getBanners } from './actions'
import { BannerManager } from '@/components/admin/BannerManager'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminBannersPage() {
    const banners = await getBanners()

    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900 mb-4 inline-block">
                    ← Volver al panel
                </Link>
                <h1 className="text-3xl font-bold text-neutral-900">Gestión de Banners</h1>
                <p className="mt-2 text-neutral-600">Administra las imágenes y textos del carrusel de la página de inicio.</p>
            </div>

            <BannerManager initialBanners={banners} />
        </div>
    )
}
