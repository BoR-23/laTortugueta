
'use client';

import React, { useState } from 'react';
import { ColorDef } from '@/lib/colors/types';
import { ThreadCard } from './ThreadCard';
import { ThreadVisual } from './ThreadVisual';
import { X, Copy, Check } from 'lucide-react';

export function SpoolCatalogGrid({ colors }: { colors: ColorDef[] }) {
    const [selectedColor, setSelectedColor] = useState<ColorDef | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
                {colors.map((color) => (
                    <ThreadCard
                        key={color.id}
                        color={color}
                        onClick={setSelectedColor}
                    />
                ))}
            </div>

            {/* Modal for detail view */}
            {selectedColor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="relative p-12 flex items-center justify-center bg-slate-50">
                            <button
                                onClick={() => setSelectedColor(null)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="w-40 h-56">
                                <ThreadVisual
                                    color={selectedColor.hex}
                                    vertical={true}
                                    className="h-full w-full shadow-lg"
                                />
                            </div>
                        </div>

                        <div className="p-8 text-center bg-white relative z-10">
                            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">#{selectedColor.id}</h2>
                            {selectedColor.marketingName && (
                                <p className="text-lg text-slate-500 font-medium mb-6">{selectedColor.marketingName}</p>
                            )}

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código HEX</span>
                                    <code className="text-sm font-bold text-slate-700">{selectedColor.hex}</code>
                                </div>
                                <button
                                    onClick={() => handleCopy(selectedColor.hex)}
                                    className="p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                                    title="Copiar HEX"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedColor(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedColor(null)} />
                </div>
            )}
        </>
    );
}
