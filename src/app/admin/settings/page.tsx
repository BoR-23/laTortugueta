import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSiteSettings } from '@/lib/settings'
import { SiteSettingsPanel } from '@/components/admin/SiteSettingsPanel'
import { LoginForm } from '@/components/admin/LoginForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return (
            <div className="mx-auto flex min-h-screen max-w-6xl 3xl:max-w-8xl items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
                <LoginForm />
            </div>
        )
    }

    const siteSettings = await getSiteSettings()

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-neutral-900">Ajustes del Sitio</h1>
                <Link
                    href="/admin"
                    className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                >
                    Volver al panel
                </Link>
            </div>

            <SiteSettingsPanel initialSettings={siteSettings} />
        </div>
    )
}
