'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface MobileCrop {
    x: number
    y: number
    size: number
}

interface MobileCropSelectorProps {
    imageUrl: string
    initialCrop?: MobileCrop
    onChange: (crop: MobileCrop) => void
}

export function MobileCropSelector({ imageUrl, initialCrop, onChange }: MobileCropSelectorProps) {
    // Only track X position - Y is always centered (50), size is always 100 (full height)
    const [cropX, setCropX] = useState(initialCrop?.x || 50)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        onChange({ x: cropX, y: 50, size: 100 })
    }, [cropX, onChange])

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs uppercase font-bold text-neutral-500 mb-2">
                    Vista Móvil - Selecciona el centro horizontal
                </label>
                <div
                    ref={containerRef}
                    className="relative w-full aspect-[21/9] bg-neutral-100 rounded-lg overflow-hidden cursor-crosshair"
                    onClick={(e) => {
                        if (!containerRef.current) return
                        const rect = containerRef.current.getBoundingClientRect()
                        const x = ((e.clientX - rect.left) / rect.width) * 100
                        setCropX(Math.max(0, Math.min(100, x)))
                    }}
                >
                    <Image
                        src={imageUrl}
                        alt="Banner preview"
                        fill
                        sizes="100vw"
                        className="object-cover pointer-events-none"
                        unoptimized
                    />

                    {/* Vertical line showing mobile center */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize"
                        style={{ left: `${cropX}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded font-mono whitespace-nowrap">
                            Centro: {Math.round(cropX)}%
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

            {/* Slider control */}
            <div>
                <label className="block text-xs text-neutral-500 mb-1">Posición Horizontal</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={cropX}
                    onChange={(e) => setCropX(Number(e.target.value))}
                    className="w-full"
                />
                <div className="text-xs text-center font-mono text-neutral-700">{Math.round(cropX)}%</div>
            </div>

            {/* Preview */}
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
                    <label className="block text-xs text-neutral-500 mb-2">Preview Móvil</label>
                    <div className="relative w-full aspect-[9/16] bg-neutral-100 rounded-lg overflow-hidden">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: 'auto 100%',
                                backgroundPosition: `${cropX}% center`,
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
