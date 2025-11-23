'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabaseBrowserClient } from '@/lib/supabaseClient'

interface ImageTaggingModalProps {
    url: string
    onClose: () => void
}

export function ImageTaggingModal({ url, onClose }: ImageTaggingModalProps) {
    const [tags, setTags] = useState<string[]>([])
    const [exif, setExif] = useState<any>(null)
    const [loadingTags, setLoadingTags] = useState(true)
    const [loadingExif, setLoadingExif] = useState(true)
    const [saving, setSaving] = useState(false)
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        // Fetch Tags
        const fetchTags = async () => {
            if (!supabaseBrowserClient) return
            const { data, error } = await supabaseBrowserClient
                .from('media_assets')
                .select('tags')
                .eq('url', url)
                .single()

            if (!error && data) {
                setTags(data.tags || [])
            }
            setLoadingTags(false)
        }

        // Fetch EXIF
        const fetchExif = async () => {
            try {
                const res = await fetch('/api/media/exif', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                })
                if (res.ok) {
                    const data = await res.json()
                    setExif(data.exif)
                }
            } catch (e) {
                console.error('Failed to load EXIF', e)
            } finally {
                setLoadingExif(false)
            }
        }

        fetchTags()
        fetchExif()
    }, [url])

    const handleAddTag = () => {
        const val = tagInput.trim()
        if (val && !tags.includes(val)) {
            setTags([...tags, val])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/media/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, tags })
            })
            if (!res.ok) throw new Error('Failed to save')
            onClose()
        } catch (e) {
            alert('Error al guardar tags')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Left: Image */}
                <div className="relative flex-1 bg-neutral-100">
                    <Image
                        src={url}
                        alt="Tagging preview"
                        fill
                        className="object-contain"
                    />
                </div>

                {/* Right: Controls */}
                <div className="flex w-96 flex-col border-l border-neutral-200 bg-white p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-900">Etiquetado</h3>
                        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
                            ✕
                        </button>
                    </div>

                    {/* Tags Section */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="mb-6">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                Tags
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                    placeholder="Añadir tag..."
                                    className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                                >
                                    +
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {loadingTags ? (
                                    <span className="text-xs text-neutral-400">Cargando tags...</span>
                                ) : tags.length > 0 ? (
                                    tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 text-neutral-400 hover:text-red-500"
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
                                    {/* Sometimes original path is in UserComment or ImageDescription depending on workflow */}
                                    {/* Also check for other common fields */}
                                    {Object.entries(exif).map(([key, val]) => {
                                        if (
                                            ['ImageDescription', 'UserComment'].includes(key) ||
                                            typeof val !== 'string'
                                        ) return null
                                        // Filter for interesting keys if needed, or just show what's there
                                        if (key.toLowerCase().includes('path') || key.toLowerCase().includes('file')) {
                                            return (
                                                <div key={key}>
                                                    <span className="font-medium">{key}:</span> {String(val)}
                                                </div>
                                            )
                                        }
                                        return null
                                    })}

                                    {/* Fallback if no specific fields found but exif exists */}
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
                            onClick={onClose}
                            className="rounded-full px-6 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
