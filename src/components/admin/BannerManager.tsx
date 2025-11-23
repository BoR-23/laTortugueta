'use client'

import { useState } from 'react'
import { HeroSlide } from '@/lib/banners'
import { createBanner, updateBanner, deleteBanner } from '@/app/admin/banners/actions'
import Image from 'next/image'
import { MobileCropSelector } from './MobileCropSelector'

export function BannerManager({ initialBanners }: { initialBanners: HeroSlide[] }) {
    const [banners, setBanners] = useState(initialBanners)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [currentCrop, setCurrentCrop] = useState<{ x: number; y: number; size: number }>({ x: 50, y: 50, size: 100 })
    const [newBannerImageUrl, setNewBannerImageUrl] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        // Add crop data
        formData.append('mobile_crop', JSON.stringify(currentCrop))

        try {
            if (isCreating) {
                await createBanner(formData)
                setIsCreating(false)
                setCurrentCrop({ x: 50, y: 50, size: 100 }) // Reset
                setNewBannerImageUrl('') // Reset
            } else if (isEditing) {
                await updateBanner(isEditing, formData)
                setIsEditing(null)
            }
            window.location.reload()
        } catch (error) {
            alert('Error saving banner')
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este banner?')) return
        try {
            await deleteBanner(id)
            window.location.reload()
        } catch (error) {
            alert('Error deleting banner')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Banners Activos</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                    Añadir Banner
                </button>
            </div>

            {isCreating && (
                <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                    <h3 className="font-semibold mb-4">Nuevo Banner</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">URL Imagen (R2)</label>
                            <input
                                name="image_url"
                                required
                                className="w-full border p-2 rounded"
                                placeholder="https://..."
                                value={newBannerImageUrl} // Controlled component
                                onChange={(e) => {
                                    const imageUrl = e.target.value
                                    setNewBannerImageUrl(imageUrl) // Update the state
                                    if (imageUrl) {
                                        setCurrentCrop({ x: 50, y: 50, size: 100 }) // Reset crop when image changes
                                    }
                                }}
                            />
                        </div>

                        {/* Show crop selector if image URL is present */}
                        {newBannerImageUrl ? (
                            <MobileCropSelector
                                imageUrl={newBannerImageUrl}
                                initialCrop={currentCrop}
                                onChange={setCurrentCrop}
                            />
                        ) : null}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Título</label>
                                <input name="title" className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Subtítulo</label>
                                <input name="subtitle" className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Texto Botón</label>
                                <input name="cta_text" className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Enlace Botón</label>
                                <input name="cta_link" className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Prioridad</label>
                            <input name="priority" type="number" defaultValue={0} className="w-full border p-2 rounded" />
                        </div>

                        {/* Mobile Crop Selector - only show if image_url is provided */}
                        <div id="crop-container"></div>

                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm">Cancelar</button>
                            <button type="submit" className="bg-neutral-900 text-white px-4 py-2 rounded text-sm">Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6">
                {banners.map(banner => (
                    <div key={banner.id} className="flex gap-6 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="relative w-48 h-32 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={banner.image_url} alt={banner.title || 'Banner'} fill sizes="200px" className="object-cover" />
                        </div>

                        {isEditing === banner.id ? (
                            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Título</label>
                                        <input name="title" defaultValue={banner.title} className="w-full border p-2 rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Subtítulo</label>
                                        <input name="subtitle" defaultValue={banner.subtitle} className="w-full border p-2 rounded" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Texto Botón</label>
                                        <input name="cta_text" defaultValue={banner.cta_text} className="w-full border p-2 rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Enlace Botón</label>
                                        <input name="cta_link" defaultValue={banner.cta_link} className="w-full border p-2 rounded" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs uppercase font-bold text-neutral-500 mb-1">Prioridad</label>
                                        <input name="priority" type="number" defaultValue={banner.priority} className="w-full border p-2 rounded" />
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input name="active" type="checkbox" defaultChecked={banner.active} value="true" />
                                            <span className="text-sm font-medium">Activo</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Mobile Crop Selector for editing */}
                                <MobileCropSelector
                                    imageUrl={banner.image_url}
                                    initialCrop={banner.mobile_crop || { x: 50, y: 50, size: 100 }}
                                    onChange={setCurrentCrop}
                                />

                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setIsEditing(null)} className="px-4 py-2 text-sm">Cancelar</button>
                                    <button type="submit" className="bg-neutral-900 text-white px-4 py-2 rounded text-sm">Actualizar</button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex-1 flex justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{banner.title || <span className="text-neutral-400 italic">Sin título</span>}</h3>
                                    <p className="text-neutral-600">{banner.subtitle}</p>
                                    <div className="mt-2 flex gap-2 text-xs text-neutral-500">
                                        <span className="bg-neutral-100 px-2 py-1 rounded">Prioridad: {banner.priority}</span>
                                        {banner.active ? (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Activo</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Inactivo</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setIsEditing(banner.id)} className="text-sm font-medium hover:underline">Editar</button>
                                    <button onClick={() => handleDelete(banner.id)} className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
