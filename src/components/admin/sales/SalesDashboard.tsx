'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { YARN_COLORS } from '@/lib/colors/constants'

// Helper to extract colors from text
const extractColors = (text: string) => {
    const matches = text.match(/\b(1\d{2})\b/g) || []
    return [...new Set(matches)].map(code => {
        const def = YARN_COLORS.find(c => c.id === parseInt(code))
        return def ? { code, hex: def.hex } : null
    }).filter(Boolean) as { code: string, hex: string }[]
}

export function SalesDashboard() {
    const [csvData, setCsvData] = useState('')
    const [importing, setImporting] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<any>({})

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/sales/stats')
            const data = await res.json()
            setStats(data)
            // Also fetch raw sales list if needed, or assume stats endpoint returns it?
            // For now let's assume we need a separate list endpoint or stats returns it.
            // Let's fetch the full list here for the table.
            // Ideally we should have a list endpoint. Let's use the stats one if it returns all, 
            // or add a list fetch. The stats endpoint currently returns aggregated data.
            // I'll add a quick fetch for the list.
            const listRes = await fetch('/api/admin/sales/list') // We need to create this or use a query
            if (listRes.ok) {
                const listData = await listRes.json()
                setSales(listData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Temporary fix: since we didn't create a list endpoint, let's fetch directly or use a server action?
    // I will create a simple list endpoint or just use the client to fetch if possible.
    // Actually, I can just fetch from the same stats endpoint if I modify it, but better to keep separate.
    // Let's assume I'll create '/api/admin/sales/list' quickly or just query via a new route.
    // For now, let's use a direct fetch to a new route I'll create in a moment.

    useEffect(() => {
        fetchStats()
    }, [])

    const handleImport = async () => {
        if (!csvData.trim()) return
        setImporting(true)
        try {
            const res = await fetch('/api/admin/sales/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csv: csvData })
            })
            if (!res.ok) throw new Error('Import failed')
            setCsvData('')
            alert('Importación completada con éxito')
            fetchStats()
        } catch (error) {
            alert('Error al importar datos')
        } finally {
            setImporting(false)
        }
    }

    const startEdit = (sale: any) => {
        setEditingId(sale.id)
        setEditForm({ ...sale })
    }

    const saveEdit = async () => {
        if (!editingId) return
        try {
            const res = await fetch(`/api/admin/sales/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })
            if (!res.ok) throw new Error('Update failed')

            setSales(sales.map(s => s.id === editingId ? { ...s, ...editForm } : s))
            setEditingId(null)
        } catch (error) {
            alert('Error al guardar')
        }
    }

    const deleteSale = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar este pedido?')) return
        try {
            await fetch(`/api/admin/sales/${id}`, { method: 'DELETE' })
            setSales(sales.filter(s => s.id !== id))
        } catch (error) {
            alert('Error al borrar')
        }
    }

    if (loading) return <div className="p-8 text-center text-neutral-500">Cargando datos...</div>

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Pedidos</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900">{stats?.totalOrders || 0}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Top Modelo</p>
                    <p className="mt-2 text-xl font-bold text-neutral-900 truncate">
                        {stats?.topProducts?.[0]?.name || '—'}
                    </p>
                    <p className="text-xs text-neutral-500">{stats?.topProducts?.[0]?.count || 0} ventas</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Próxima Entrega</p>
                    <p className="mt-2 text-lg font-bold text-neutral-900 truncate">
                        {stats?.upcomingDeliveries?.[0]?.date || '—'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{stats?.upcomingDeliveries?.[0]?.client || ''}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Ingresos Totales</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900">
                        {sales.reduce((sum, sale) => sum + (sale.product_price || 0), 0).toFixed(2)}€
                    </p>
                </div>
            </div>

            {/* Import Box */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900">
                        <span>Importar Nuevos Pedidos</span>
                        <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-4">
                        <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            className="h-32 w-full rounded-xl border border-neutral-200 p-3 text-xs font-mono focus:border-neutral-900 focus:outline-none"
                            placeholder="Pega aquí los datos del Excel..."
                        />
                        <button
                            onClick={handleImport}
                            disabled={importing || !csvData.trim()}
                            className="mt-4 rounded-full bg-neutral-900 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {importing ? 'Procesando...' : 'Importar Datos'}
                        </button>

                        <div className="mt-6 border-t border-neutral-100 pt-4">
                            <p className="text-xs text-neutral-400 mb-2">Herramientas de Mantenimiento</p>
                            <button
                                onClick={async () => {
                                    if (!confirm('Esto revisará TODOS los pedidos antiguos buscando "Mayor" y corregirá sus precios al 50%. ¿Continuar?')) return
                                    setImporting(true)
                                    try {
                                        const res = await fetch('/api/admin/sales/fix-wholesale', { method: 'POST' })
                                        const data = await res.json()
                                        alert(data.message || 'Proceso terminado')
                                        fetchStats()
                                    } catch (e) {
                                        alert('Error al corregir')
                                    } finally {
                                        setImporting(false)
                                    }
                                }}
                                disabled={importing}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                            >
                                🔄 Corregir precios de pedidos antiguos ("Mayor")
                            </button>
                        </div>
                    </div>
                </details>
            </div>

            {/* Sales Table */}
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                        <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Pedido</th>
                                <th className="px-6 py-3 font-medium">Fecha</th>
                                <th className="px-6 py-3 font-medium">Cliente</th>
                                <th className="px-6 py-3 font-medium">Modelo / Talla</th>
                                <th className="px-6 py-3 font-medium">Precio</th>
                                <th className="px-6 py-3 font-medium">Tipo</th>
                                <th className="px-6 py-3 font-medium">Detalles / Colores</th>
                                <th className="px-6 py-3 font-medium">Entrega</th>
                                <th className="px-6 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                            {(() => {
                                let lastOrderId = ''
                                let isAlternateGroup = false

                                return sales.map((sale) => {
                                    // Grouping Logic
                                    if (sale.order_id !== lastOrderId) {
                                        isAlternateGroup = !isAlternateGroup
                                        lastOrderId = sale.order_id
                                    }
                                    const rowClass = isAlternateGroup ? 'bg-neutral-50/50' : 'bg-white'

                                    return (
                                        <tr key={sale.id} className={`group hover:bg-neutral-100 transition-colors ${rowClass}`}>
                                            {editingId === sale.id ? (
                                                // Edit Mode
                                                <>
                                                    <td className="px-6 py-4"><input className="w-full rounded border p-1" value={editForm.order_id} onChange={e => setEditForm({ ...editForm, order_id: e.target.value })} /></td>
                                                    <td className="px-6 py-4"><input type="date" className="w-full rounded border p-1" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} /></td>
                                                    <td className="px-6 py-4"><input className="w-full rounded border p-1" value={editForm.client} onChange={e => setEditForm({ ...editForm, client: e.target.value })} /></td>
                                                    <td className="px-6 py-4">
                                                        <input className="w-full rounded border p-1 mb-1" placeholder="Modelo" value={editForm.product_name} onChange={e => setEditForm({ ...editForm, product_name: e.target.value })} />
                                                        <input className="w-full rounded border p-1" placeholder="Talla" value={editForm.size} onChange={e => setEditForm({ ...editForm, size: e.target.value })} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full rounded border p-1"
                                                            value={editForm.product_price}
                                                            onChange={e => setEditForm({ ...editForm, product_price: parseFloat(e.target.value) })}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            className="w-full rounded border p-1"
                                                            value={editForm.is_wholesale ? 'wholesale' : 'retail'}
                                                            onChange={e => {
                                                                const isWholesale = e.target.value === 'wholesale'
                                                                let newPrice = parseFloat(editForm.product_price) || 0

                                                                if (isWholesale && !editForm.is_wholesale) {
                                                                    newPrice = newPrice * 0.5
                                                                } else if (!isWholesale && editForm.is_wholesale) {
                                                                    newPrice = newPrice * 2
                                                                }

                                                                setEditForm({
                                                                    ...editForm,
                                                                    is_wholesale: isWholesale,
                                                                    product_price: newPrice
                                                                })
                                                            }}
                                                        >
                                                            <option value="retail">Por menor</option>
                                                            <option value="wholesale">Por mayor (-50%)</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4"><textarea className="w-full rounded border p-1" value={editForm.details} onChange={e => setEditForm({ ...editForm, details: e.target.value })} /></td>
                                                    <td className="px-6 py-4"><input className="w-full rounded border p-1" value={editForm.delivery_date} onChange={e => setEditForm({ ...editForm, delivery_date: e.target.value })} /></td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={saveEdit} className="text-green-600 hover:text-green-800 mr-2">Guardar</button>
                                                        <button onClick={() => setEditingId(null)} className="text-neutral-500 hover:text-neutral-700">Cancelar</button>
                                                    </td>
                                                </>
                                            ) : (
                                                // View Mode
                                                <>
                                                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">{sale.order_id}</td>
                                                    <td className="px-6 py-4 text-neutral-500">{sale.date}</td>
                                                    <td className="px-6 py-4 font-medium text-neutral-900">{sale.client}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="relative group/image">
                                                            <span className="font-medium text-neutral-900 cursor-help border-b border-dotted border-neutral-300">
                                                                {sale.product_name}
                                                            </span>
                                                            {sale.product_image && (
                                                                <div className="absolute left-0 bottom-full mb-2 hidden w-32 rounded-lg border border-neutral-200 bg-white p-1 shadow-xl group-hover/image:block z-10">
                                                                    <div className="relative aspect-square w-full overflow-hidden rounded">
                                                                        <Image src={sale.product_image} alt="" fill className="object-cover" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">T/{sale.size}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                        {sale.product_price ? `${sale.product_price.toFixed(2)}€` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`¿Cambiar a ${sale.is_wholesale ? 'Por menor' : 'Por mayor'}? El precio se actualizará.`)) return

                                                                const newIsWholesale = !sale.is_wholesale
                                                                let newPrice = sale.product_price || 0

                                                                if (newIsWholesale) {
                                                                    newPrice = newPrice * 0.5
                                                                } else {
                                                                    newPrice = newPrice * 2
                                                                }

                                                                try {
                                                                    const res = await fetch(`/api/admin/sales/${sale.id}`, {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            ...sale,
                                                                            is_wholesale: newIsWholesale,
                                                                            product_price: newPrice
                                                                        })
                                                                    })
                                                                    if (!res.ok) throw new Error('Update failed')

                                                                    setSales(sales.map(s => s.id === sale.id ? { ...s, is_wholesale: newIsWholesale, product_price: newPrice } : s))
                                                                } catch (error) {
                                                                    alert('Error al actualizar')
                                                                }
                                                            }}
                                                            className={`cursor-pointer hover:underline ${sale.is_wholesale ? 'text-blue-600 font-semibold' : 'text-neutral-500'}`}
                                                        >
                                                            {sale.is_wholesale ? 'Por mayor' : 'Por menor'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-neutral-600 mb-2">{sale.details}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {extractColors(sale.details || '').map((c, i) => (
                                                                <div key={i} className="group/color relative h-4 w-4 rounded-full border border-neutral-200 shadow-sm" style={{ backgroundColor: c.hex }}>
                                                                    <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 hidden rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] text-white group-hover/color:block whitespace-nowrap z-10">
                                                                        {c.code}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${sale.status === 'delivered' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                            {sale.delivery_date || 'Pendiente'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => startEdit(sale)} className="text-neutral-400 hover:text-neutral-900 mr-3">✎</button>
                                                        <button onClick={() => deleteSale(sale.id)} className="text-neutral-400 hover:text-red-600">🗑</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    )
                                })
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
