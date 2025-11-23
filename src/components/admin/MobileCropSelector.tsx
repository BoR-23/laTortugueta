'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface MobileCropSelectorProps {
    imageUrl: string
    initialCrop?: { x: number; y: number; size: number }
    onChange: (crop: { x: number; y: number; size: number }) => void
}

export function MobileCropSelector({ imageUrl, initialCrop, onChange }: MobileCropSelectorProps) {
    const [crop, setCrop] = useState(initialCrop || { x: 50, y: 50, size: 56 })
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        onChange(crop)
    }, [crop, onChange])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        // Mobile aspect ratio is ~9:16 (vertical), so height is larger than width
        // For a 21:9 desktop image, a mobile crop should be narrower and taller
        const mobileAspectRatio = 9 / 16 // width / height
        const cropWidth = crop.size
        const cropHeight = cropWidth / mobileAspectRatio // height is larger

        setCrop(prev => ({
            ...prev,
            x: Math.max(cropWidth / 2, Math.min(100 - cropWidth / 2, x)),
            y: Math.max(cropHeight / 2, Math.min(100 - cropHeight / 2, y))
        }))
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, crop.size])

    // Mobile is 9:16 aspect ratio
    const mobileAspectRatio = 9 / 16
    const cropWidth = crop.size
    const cropHeight = cropWidth / mobileAspectRatio

    const cropStyle = {
        left: `${crop.x - cropWidth / 2}%`,
        top: `${crop.y - cropHeight / 2}%`,
        width: `${cropWidth}%`,
        height: `${cropHeight}%`
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs uppercase font-bold text-neutral-500 mb-2">
                    Vista Móvil - Selecciona el área (9:16)
                </label>
                <div
                    ref={containerRef}
                    className="relative w-full aspect-[21/9] bg-neutral-100 rounded-lg overflow-hidden cursor-crosshair"
                >
                    <Image
                        src={imageUrl}
                        alt="Banner preview"
                        fill
                        sizes="100vw"
                        className="object-cover pointer-events-none"
                        unoptimized
                    />

                    {/* Crop overlay - vertical mobile format */}
                    <div
                        className="absolute border-4 border-blue-500 bg-blue-500/20 cursor-move"
                        style={cropStyle}
                        onMouseDown={handleMouseDown}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-mono">
                                Vista Móvil
                            </div>
                        </div>
                    </div>

                    {/* Grid guides */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30"></div>
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30"></div>
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30"></div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs text-neutral-500 mb-1">Tamaño (%)</label>
                    <input
                        type="range"
                        min="30"
                        max="100"
                        value={crop.size}
                        onChange={(e) => setCrop(prev => ({ ...prev, size: Number(e.target.value) }))}
                        className="w-full"
                    />
                    <div className="text-xs text-center font-mono text-neutral-700">{crop.size}%</div>
                </div>
                <div>
                    <label className="block text-xs text-neutral-500 mb-1">Horizontal</label>
                    <input
                        type="range"
                        min={crop.size / 2}
                        max={100 - crop.size / 2}
                        value={crop.x}
                        onChange={(e) => setCrop(prev => ({ ...prev, x: Number(e.target.value) }))}
                        className="w-full"
                    />
                    <div className="text-xs text-center font-mono text-neutral-700">{Math.round(crop.x)}%</div>
                </div>
                <div>
                    <label className="block text-xs text-neutral-500 mb-1">Vertical</label>
                    <input
                        type="range"
                        min={crop.size / 2}
                        max={100 - crop.size / 2}
                        value={crop.y}
                        onChange={(e) => setCrop(prev => ({ ...prev, y: Number(e.target.value) }))}
                        className="w-full"
                    />
                    <div className="text-xs text-center font-mono text-neutral-700">{Math.round(crop.y)}%</div>
                </div>
            </div>

            {/* Mobile preview */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-neutral-500 mb-2">Preview Desktop</label>
                    <div className="relative w-full aspect-[21/9] bg-neutral-100 rounded-lg overflow-hidden">
                        <Image
                            src={imageUrl}
                            alt="Desktop preview"
                            fill
                            sizes="400px"
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-neutral-500 mb-2">Preview Móvil (9:16)</label>
                    <div className="relative w-full aspect-[9/16] bg-neutral-100 rounded-lg overflow-hidden">
                        <div
                            className="relative w-full h-full"
                            style={{
                                transform: `scale(${100 / crop.size})`,
                                transformOrigin: `${crop.x}% ${crop.y}%`
                            }}
                        >
                            <Image
                                src={imageUrl}
                                alt="Mobile preview"
                                fill
                                sizes="200px"
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
