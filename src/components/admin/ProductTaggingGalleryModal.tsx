'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { supabaseBrowserClient } from '@/lib/supabaseClient'
import { getProductImageVariant } from '@/lib/images'

interface ProductTaggingGalleryModalProps {
    productName: string
    gallery: string[]
    initialIndex?: number
    onClose: () => void
}

export function ProductTaggingGalleryModal({ productName, gallery, initialIndex = 0, onClose }: ProductTaggingGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [saving, setSaving] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [colorInput, setColorInput] = useState('')
    const [availableGeneralTags, setAvailableGeneralTags] = useState<string[]>([])
    const [availableColorTags, setAvailableColorTags] = useState<string[]>([])
    const [loadingTags, setLoadingTags] = useState(false)
    const [loadingExif, setLoadingExif] = useState(false)
    const [exif, setExif] = useState<any>(null)

    const currentUrl = gallery[currentIndex]

    // Fetch available tags
    useEffect(() => {
        const loadTags = async () => {
            setLoadingTags(true)
            try {
                if (!supabaseBrowserClient) {
                    setLoadingTags(false)
                    return
                }

                const { data, error } = await supabaseBrowserClient
                    .from('categories')
                    .select('tag_key')
                    .not('tag_key', 'is', null)

                if (error) throw error

                const uniqueTags = Array.from(new Set(data?.map((cat: any) => cat.tag_key).filter(Boolean))) as string[]
                // The original code separated general and color tags, so we'll maintain that structure
                const sorted = uniqueTags.sort()
                setAvailableColorTags(sorted.filter(t => t.startsWith('Color')))
                setAvailableGeneralTags(sorted.filter(t => !t.startsWith('Color')))
            } catch (err) {
                console.error('Error loading tags:', err)
            } finally {
                setLoadingTags(false)
            }
        }
        loadTags()
    }, [])

    // Fetch current image data (tags + exif)
    useEffect(() => {
        if (!currentUrl) return

        const fetchData = async () => {
            if (!supabaseBrowserClient) return

            setLoadingExif(true)
            setTags([]) // Reset tags while loading
            try {
                // 1. Fetch tags from media_assets
                const { data: mediaData } = await supabaseBrowserClient
                    .from('media_assets')
                    .select('tags')
                    .eq('url', currentUrl)
                    .single()

                if (mediaData?.tags) {
                    setTags(mediaData.tags)
                }

                // 2. Fetch EXIF from the same table
                const { data: exifDataFromDb } = await supabaseBrowserClient
                    .from('media_assets')
                    .select('exif')
                    .eq('url', currentUrl)
                    .single()

                if (exifDataFromDb?.exif) {
                    setExif(exifDataFromDb.exif)
                } else {
                    setExif(null)
                }
            } catch (error) {
                console.error('Error fetching image data:', error)
            } finally {
                setLoadingExif(false)
            }
        }
        fetchData()
    }, [currentUrl])

    const handleAddTag = async (value: string, isColor: boolean) => {
        let val = value.trim()
        if (!val) return

        if (isColor) {
            // Auto-prepend "Color " if missing
            if (!val.toLowerCase().startsWith('color')) {
                // If user typed "135", make it "Color 135"
                // If user typed "color 135" (lowercase), make it "Color 135"
                // We'll just force "Color " prefix + the rest
                val = `Color ${val.replace(/^color\s*/i, '')}`
            }

            // Check if this color tag exists in availableColorTags
            // If not, we might want to auto-create the category
            const exists = availableColorTags.some(t => t.toLowerCase() === val.toLowerCase())
            if (!exists) {
                try {
                    const res = await fetch('/api/categories/create-color', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tagName: val })
                    })
                    if (res.ok) {
                        const { category } = await res.json()
                        // Update local available tags
                        setAvailableColorTags(prev => [...prev, category.tag_key].sort())
                    }
                } catch (err) {
                    console.error('Failed to auto-create color category', err)
                }
            }
            setColorInput('')
        } else {
            setTagInput('')
        }

        if (!tags.includes(val)) {
            setTags([...tags, val])
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Save tags to media_assets
            const res = await fetch('/api/media/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentUrl, tags })
            })
            if (!res.ok) throw new Error('Failed to save media tags')

            // Optional: Show success feedback?
        } catch (e) {
            console.error(e)
            alert('Error al guardar tags')
        } finally {
            setSaving(false)
        }
    }

    const handleNext = () => {
        if (currentIndex < gallery.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext()
        if (e.key === 'ArrowLeft') handlePrev()
        if (e.key === 'Escape') onClose()
    }, [currentIndex, gallery.length, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    if (!currentUrl) return null

    const displayUrl = getProductImageVariant(currentUrl, 'original') || currentUrl

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">

                {/* Left: Image & Navigation */}
                <div className="relative flex flex-1 flex-col bg-neutral-900">
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="relative h-full w-full">
                            <Image
                                src={displayUrl}
                                alt="Tagging preview"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6 text-white">
                        <div className="text-sm font-medium">
                            {currentIndex + 1} / {gallery.length}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-30"
                            >
                                ← Anterior
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentIndex === gallery.length - 1}
                                className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-30"
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex w-96 flex-col border-l border-neutral-200 bg-white p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900">Etiquetado</h3>
                            <p className="text-xs text-neutral-500">{productName}</p>
                        </div>
                        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
                            ✕
                        </button>
                    </div>

                    {/* Tags Section */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="mb-6 space-y-6">
                            {/* General Tags */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                    Etiquetas Generales
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTag(tagInput, false)}
                                        placeholder="Añadir etiqueta..."
                                        list="available-general-tags"
                                        className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                                    />
                                    <datalist id="available-general-tags">
                                        {availableGeneralTags.map(tag => (
                                            <option key={tag} value={tag} />
                                        ))}
                                    </datalist>
                                    <button
                                        onClick={() => handleAddTag(tagInput, false)}
                                        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Color Tags */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                    Colores
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={colorInput}
                                        onChange={e => setColorInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTag(colorInput, true)}
                                        placeholder="Añadir color..."
                                        list="available-color-tags"
                                        className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                                    />
                                    <datalist id="available-color-tags">
                                        {availableColorTags.map(tag => (
                                            <option key={tag} value={tag} />
                                        ))}
                                    </datalist>
                                    <button
                                        onClick={() => handleAddTag(colorInput, true)}
                                        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Selected Tags Display */}
                            <div className="flex flex-wrap gap-2">
                                {loadingTags ? (
                                    <span className="text-xs text-neutral-400">Cargando tags...</span>
                                ) : tags.length > 0 ? (
                                    tags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${tag.startsWith('Color') ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-neutral-700'}`}
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 opacity-50 hover:opacity-100"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs italic text-neutral-400">Sin etiquetas</span>
                                )}
                            </div>
                        </div>

                        {/* EXIF Section */}
                        <div className="border-t border-neutral-100 pt-6">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                Información Original (EXIF)
                            </label>
                            {loadingExif ? (
                                <span className="text-xs text-neutral-400">Cargando EXIF...</span>
                            ) : exif ? (
                                <div className="space-y-2 text-xs text-neutral-600">
                                    {/* Try to find relevant fields based on inspect_exif_data.js output */}
                                    {exif.ImageDescription && (
                                        <div>
                                            <span className="font-medium">Descripción:</span> {exif.ImageDescription}
                                        </div>
                                    )}
                                    {exif.UserComment && (
                                        <div>
                                            <span className="font-medium">Comentario:</span> {exif.UserComment}
                                        </div>
                                    )}

                                    {/* Show all other string fields that might be relevant */}
                                    {Object.entries(exif).map(([key, val]) => {
                                        if (
                                            ['ImageDescription', 'UserComment'].includes(key) ||
                                            typeof val !== 'string'
                                        ) return null

                                        if (key.toLowerCase().includes('path') || key.toLowerCase().includes('file')) {
                                            return (
                                                <div key={key}>
                                                    <span className="font-medium">{key}:</span> {String(val)}
                                                </div>
                                            )
                                        }
                                        return null
                                    })}

                                    <details>
                                        <summary className="cursor-pointer text-neutral-400 hover:text-neutral-600">Ver todo</summary>
                                        <pre className="mt-2 overflow-x-auto rounded bg-neutral-50 p-2 font-mono text-[10px]">
                                            {JSON.stringify(exif, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ) : (
                                <span className="text-xs italic text-neutral-400">No se encontró información EXIF.</span>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex justify-end gap-3 border-t border-neutral-100 pt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
