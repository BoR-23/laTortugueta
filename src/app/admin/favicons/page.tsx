import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FaviconManager } from '@/components/admin/FaviconManager'

export const metadata = {
    title: 'Favicons - Admin',
    description: 'Manage website favicons'
}

export default async function FaviconsAdminPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
        redirect('/api/auth/signin')
    }

    return (
        <div className="min-h-screen bg-neutral-100 p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900">Favicons</h1>
                    <p className="text-neutral-600 mt-2">
                        Gestiona los iconos que aparecen en las pestañas del navegador
                    </p>
                </div>

                <FaviconManager />
            </div>
        </div>
    )
}
