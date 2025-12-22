
'use client';

import React, { useState } from 'react';
import { ColorDef } from '@/lib/colors/types';
import { ColorCatalogGrid } from './ColorCatalogGrid';
import { SpoolCatalogGrid } from './SpoolCatalogGrid';
import { Camera, Palette } from 'lucide-react';

interface ColorBrowserProps {
    colors: ColorDef[];
}

type ViewMode = 'photo' | 'spool';

export function ColorBrowser({ colors }: ColorBrowserProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('photo');

    return (
        <div className="space-y-8">
            {/* View Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setViewMode('photo')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all
                            ${viewMode === 'photo'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        <Camera size={16} />
                        BOBINAS
                    </button>
                    <button
                        onClick={() => setViewMode('spool')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all
                            ${viewMode === 'spool'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        <Palette size={16} />
                        COLORES
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
                {viewMode === 'photo' ? (
                    <ColorCatalogGrid colors={colors} />
                ) : (
                    <SpoolCatalogGrid colors={colors} />
                )}
            </div>
        </div>
    );
}
