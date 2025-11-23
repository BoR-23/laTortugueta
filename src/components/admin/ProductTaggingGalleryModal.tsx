'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { supabaseBrowserClient } from '@/lib/supabaseClient'
import { getProductImageVariant } from '@/lib/images'

interface ProductTaggingGalleryModalProps {
    productName: string
    gallery: string[]
    initialIndex?: number
    onClose: () => void
    onImagesUpdated?: () => void
}

export function ProductTaggingGalleryModal({ productName, gallery, initialIndex = 0, onClose, onImagesUpdated }: ProductTaggingGalleryModalProps) {
    const [localGallery, setLocalGallery] = useState(gallery)
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
    const [showMoveModal, setShowMoveModal] = useState(false)
    const [targetProducts, setTargetProducts] = useState<Array<{ id: string, name: string }>>([])
    const [movingTo, setMovingTo] = useState<string | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [tagInputFocused, setTagInputFocused] = useState(false)
    const [colorInputFocused, setColorInputFocused] = useState(false)


    const currentUrl = localGallery[currentIndex]

    // Sync local gallery if prop changes (e.g. if parent forces a full reload)
    useEffect(() => {
        setLocalGallery(gallery)
    }, [gallery])

    // Auto-scroll to current product in move modal
    useEffect(() => {
        if (showMoveModal && targetProducts.length > 0 && scrollContainerRef.current) {
            const index = targetProducts.findIndex(p => p.name === productName)
            if (index !== -1) {
                // Scroll to center the item
                const itemHeight = 50 // Approx height of button + gap
                const containerHeight = scrollContainerRef.current.clientHeight
                const scrollTop = (index * itemHeight) - (containerHeight / 2) + (itemHeight / 2)
                scrollContainerRef.current.scrollTo({ top: scrollTop, behavior: 'instant' })
            }
        }
    }, [showMoveModal, targetProducts, productName])

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
                    .in('scope', ['header', 'filter'])

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
                    // Fallback to API if not in DB
                    try {
                        const res = await fetch('/api/media/exif', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: currentUrl })
                        })
                        if (res.ok) {
                            const { exif } = await res.json()
                            setExif(exif)
                        } else {
                            setExif(null)
                        }
                    } catch (e) {
                        console.error('Error fetching EXIF from API:', e)
                        setExif(null)
                    }
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

    const loadProducts = async () => {
        if (!supabaseBrowserClient) return
        try {
            const { data } = await supabaseBrowserClient
                .from('products')
                .select('id, name')
                .order('name')

            setTargetProducts(data || [])
        } catch (err) {
            console.error('Error loading products:', err)
        }
    }

    const handleMovePhoto = async (targetProductId: string, targetProductName: string) => {
        setMovingTo(targetProductId)
        try {
            const res = await fetch('/api/media/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetUrl: currentUrl,
                    targetProductId,
                    targetProductName
                })
            })

            if (!res.ok) throw new Error('Failed to move photo')

            // Update local gallery
            const newGallery = localGallery.filter(url => url !== currentUrl)
            setLocalGallery(newGallery)

            // Notify parent to refresh data (background)
            if (onImagesUpdated) {
                onImagesUpdated()
            }

            if (newGallery.length === 0) {
                onClose()
            } else {
                // Adjust index if needed
                if (currentIndex >= newGallery.length) {
                    setCurrentIndex(newGallery.length - 1)
                }
                // Do NOT close, let user continue
            }

            setShowMoveModal(false)
        } catch (err) {
            console.error('Error moving photo:', err)
            alert('Error al mover la foto')
        } finally {
            setMovingTo(null)
        }
    }

    const handleDeletePhoto = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta foto? Esta acción no se puede deshacer.')) return

        setMovingTo('deleting') // Reuse state or add new one? Let's use movingTo for loading state
        try {
            const res = await fetch('/api/media/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetUrl: currentUrl })
            })

            if (!res.ok) throw new Error('Failed to delete photo')

            // Update local gallery
            const newGallery = localGallery.filter(url => url !== currentUrl)
            setLocalGallery(newGallery)

            // Notify parent to refresh data
            if (onImagesUpdated) {
                onImagesUpdated()
            }

            if (newGallery.length === 0) {
                onClose()
            } else {
                // Adjust index if needed
                if (currentIndex >= newGallery.length) {
                    setCurrentIndex(newGallery.length - 1)
                }
                // Do NOT close
            }
        } catch (err) {
            console.error('Error deleting photo:', err)
            alert('Error al eliminar la foto')
        } finally {
            setMovingTo(null)
        }
    }

    const handleNext = () => {
        if (currentIndex < localGallery.length - 1) {
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
    }, [currentIndex, localGallery.length, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Preload next/prev images for instant navigation
    useEffect(() => {
        if (!localGallery.length) return

        const preloadImage = (url: string) => {
            const img = new window.Image()
            img.src = getProductImageVariant(url, 'original') || url
        }

        // Preload next 3 images
        for (let i = 1; i <= 3; i++) {
            if (currentIndex + i < localGallery.length) {
                preloadImage(localGallery[currentIndex + i])
            }
        }

        // Preload previous image
        if (currentIndex > 0) {
            preloadImage(localGallery[currentIndex - 1])
        }
    }, [currentIndex, localGallery])

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
                            {currentIndex + 1} / {localGallery.length}
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
                                disabled={currentIndex === localGallery.length - 1}
                                className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-30"
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex w-96 flex-col border-l border-neutral-200 bg-white">
                    <div className="flex items-center justify-between p-6">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900">Etiquetado</h3>
                            <p className="text-xs text-neutral-500">{productName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="flex-1 overflow-y-auto px-6">
                        {/* General Tags Section */}
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                Etiquetas Generales
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onFocus={() => setTagInputFocused(true)}
                                    onBlur={() => setTimeout(() => setTagInputFocused(false), 200)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && tagInput.trim()) {
                                            e.preventDefault()
                                            handleAddTag(tagInput, false)
                                            setTagInput('')
                                        }
                                    }}
                                    placeholder="Escribe para buscar o añadir..."
                                    className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 focus:border-neutral-900 focus:outline-none"
                                />
                                {tagInputFocused && (
                                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                                        {availableGeneralTags
                                            .filter(t => (tagInput ? t.toLowerCase().includes(tagInput.toLowerCase()) : true) && !tags.includes(t))
                                            .map(tag => (
                                                <button
                                                    key={tag}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        handleAddTag(tag, false)
                                                        setTagInput('')
                                                    }}
                                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        {availableGeneralTags.filter(t => (tagInput ? t.toLowerCase().includes(tagInput.toLowerCase()) : true) && !tags.includes(t)).length === 0 && tagInput && (
                                            <div className="px-4 py-2 text-xs text-neutral-400">
                                                Presiona Enter para añadir "{tagInput}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Color Tags Section */}
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                Colores
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={colorInput}
                                    onChange={e => setColorInput(e.target.value)}
                                    onFocus={() => setColorInputFocused(true)}
                                    onBlur={() => setTimeout(() => setColorInputFocused(false), 200)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && colorInput.trim()) {
                                            e.preventDefault()
                                            handleAddTag(colorInput, true)
                                            setColorInput('')
                                        }
                                    }}
                                    placeholder="Buscar color (ej: 118)..."
                                    className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 focus:border-neutral-900 focus:outline-none"
                                />
                                {colorInputFocused && (
                                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                                        {availableColorTags
                                            .filter(t => (colorInput ? t.toLowerCase().includes(colorInput.toLowerCase()) : true) && !tags.includes(t))
                                            .map(tag => (
                                                <button
                                                    key={tag}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        handleAddTag(tag, true)
                                                        setColorInput('')
                                                    }}
                                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-700"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        {availableColorTags.filter(t => (colorInput ? t.toLowerCase().includes(colorInput.toLowerCase()) : true) && !tags.includes(t)).length === 0 && colorInput && (
                                            <div className="px-4 py-2 text-xs text-neutral-400">
                                                Presiona Enter para añadir "{colorInput}"
                                            </div>
                                        )}
                                    </div>
                                )}
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
                    <div className="border-t border-neutral-100 px-6 py-6">
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

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-6">
                        <button
                            onClick={handleDeletePhoto}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar foto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Eliminar
                        </button>

                        <div className="flex gap-3">
                            {/* Save button */}
                            <button
                                onClick={() => {
                                    loadProducts()
                                    setShowMoveModal(true)
                                }}
                                className="rounded-lg border border-neutral-900 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                            >
                                Enviar a...
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Guardar Tags'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Move Modal */}
                {showMoveModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMoveModal(false)}>
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="mb-4 text-lg font-semibold">Enviar foto a otro producto</h3>

                            <div ref={scrollContainerRef} className="max-h-96 space-y-2 overflow-y-auto">
                                {targetProducts.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleMovePhoto(product.id, product.name)}
                                        disabled={movingTo === product.id}
                                        className="w-full rounded-lg border border-neutral-200 p-3 text-left hover:border-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                                    >
                                        {product.name}
                                        {movingTo === product.id && <span className="ml-2 text-xs text-neutral-500">Moviendo...</span>}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="mt-4 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
