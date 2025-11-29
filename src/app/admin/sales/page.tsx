import { SalesDashboard } from '@/components/admin/sales/SalesDashboard'

export const dynamic = 'force-dynamic'

export default function SalesPage() {
    return (
        <div className="mx-auto max-w-7xl 2xl:max-w-8xl px-4 py-12 sm:px-6 lg:px-10">
            <div className="mb-10">
                <h1 className="text-2xl font-semibold text-neutral-900">Panel de Ventas</h1>
                <p className="mt-2 text-sm text-neutral-600">
                    Gestiona los pedidos, analiza las ventas y controla las próximas entregas.
                </p>
            </div>

            <SalesDashboard />
        </div>
    )
}
