'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface FaviconFile {
    name: string
    url: string
    size: number
    lastModified: string
}

export function FaviconManager() {
    const [files, setFiles] = useState<FaviconFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadFavicons = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/favicons/list')
            if (!response.ok) throw new Error('Failed to load favicons')
            const data = await response.json()
            setFiles(data.files || [])
        } catch (err) {
            console.error(err)
            setError('Error loading favicons')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFavicons()
    }, [])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/favicons/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const result = await response.json()
            console.log('Upload successful:', result)

            // Reload the list
            await loadFavicons()
        } catch (err) {
            console.error(err)
            setError('Failed to upload and process favicon')
        } finally {
            setUploading(false)
            // Reset file input
            e.target.value = ''
        }
    }

    const handleDelete = async (fileName: string) => {
        if (!confirm(`¿Eliminar ${fileName}?`)) return

        try {
            const response = await fetch(`/api/favicons/delete?file=${encodeURIComponent(fileName)}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Delete failed')

            await loadFavicons()
        } catch (err) {
            console.error(err)
            setError('Failed to delete favicon')
        }
    }

    const handleDeleteAll = async () => {
        if (!confirm('¿Eliminar TODOS los favicons? Esta acción no se puede deshacer.')) return

        setError(null)
        try {
            for (const file of files) {
                await fetch(`/api/favicons/delete?file=${encodeURIComponent(file.name)}`, {
                    method: 'DELETE'
                })
            }
            await loadFavicons()
        } catch (err) {
            console.error(err)
            setError('Failed to delete all favicons')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Gestión de Favicons</h2>
                    <p className="text-sm text-neutral-600 mt-1">
                        Sube una imagen PNG de alta resolución (mínimo 512x512px)
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Upload Section */}
            <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h3 className="font-semibold mb-4">Subir Nueva Imagen</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <span className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50">
                                {uploading ? 'Procesando...' : 'Seleccionar Imagen'}
                            </span>
                        </label>
                        {uploading && (
                            <span className="text-sm text-neutral-600">
                                Generando todos los tamaños y formatos...
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-neutral-500 space-y-1">
                        <p>• Se generarán automáticamente todos los tamaños necesarios</p>
                        <p>• Formatos: favicon.ico, PNG 16x16, 32x32, 180x180 (Apple), 192x192, 512x512 (Android)</p>
                        <p>• Los archivos se subirán a R2 y estarán disponibles inmediatamente</p>
                    </div>
                </div>
            </div>

            {/* Current Favicons */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Favicons Actuales</h3>
                    {files.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="text-sm text-red-600 hover:underline font-medium"
                        >
                            Eliminar Todos
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-neutral-500">
                        Cargando...
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
                        No hay favicons subidos. Sube una imagen para empezar.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {files.map(file => (
                            <div
                                key={file.name}
                                className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm"
                            >
                                <div className="flex gap-4">
                                    <div className="relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {file.name.endsWith('.png') ? (
                                            <Image
                                                src={file.url}
                                                alt={file.name}
                                                width={64}
                                                height={64}
                                                className="object-contain"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-xs text-neutral-400">.ico</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{file.name}</h4>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                        <button
                                            onClick={() => handleDelete(file.name)}
                                            className="text-xs text-red-600 hover:underline mt-2"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview URL */}
            {files.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">URLs Públicas</h4>
                    <div className="space-y-1 text-xs text-neutral-700 font-mono">
                        {files.map(file => (
                            <div key={file.name} className="flex gap-2">
                                <span className="text-neutral-500">{file.name}:</span>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                >
                                    {file.url}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
