'use client'

import React, { useState, useMemo } from 'react';
import { YARN_COLORS } from '@/lib/colors/constants';
import { ColorDef } from '@/lib/colors/types';
import { X, Check, Search } from 'lucide-react';
import Image from 'next/image';

interface ColorSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (colors: SelectedColors) => void;
    allow4Colors?: boolean;
    initialColors?: SelectedColors;
}

export interface SelectedColors {
    base: ColorDef | null;
    drawing: ColorDef | null;
    detail: ColorDef | null;
    variation?: ColorDef | null;
}

type ColorRole = 'base' | 'drawing' | 'detail' | 'variation';

export const ColorSelectionModal: React.FC<ColorSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    allow4Colors = false,
    initialColors
}) => {
    const [selectedColors, setSelectedColors] = useState<SelectedColors>(initialColors || {
        base: null,
        drawing: null,
        detail: null,
        variation: null
    });

    const [activeTab, setActiveTab] = useState<ColorRole>('base');
    const [search, setSearch] = useState('');

    const filteredColors = useMemo(() => {
        if (!search) return YARN_COLORS;
        const lower = search.toLowerCase();
        return YARN_COLORS.filter(c =>
            c.id.toString().includes(lower) ||
            c.marketingName?.toLowerCase().includes(lower)
        );
    }, [search]);

    const handleColorSelect = (color: ColorDef) => {
        setSelectedColors(prev => ({ ...prev, [activeTab]: color }));

        // Auto-advance to next tab
        if (activeTab === 'base') setActiveTab('drawing');
        else if (activeTab === 'drawing') setActiveTab('detail');
        else if (activeTab === 'detail' && allow4Colors) setActiveTab('variation');
    };

    const handleConfirm = () => {
        onSelect(selectedColors);
        onClose();
    };

    if (!isOpen) return null;

    const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

    const tabs: { id: ColorRole; label: string }[] = [
        { id: 'base', label: 'Base' },
        { id: 'drawing', label: 'Dibujo' },
        { id: 'detail', label: 'Detalle' },
        ...(allow4Colors ? [{ id: 'variation', label: 'Var. Detalle' } as const] : [])
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Elige tus colores</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs & Preview */}
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {tabs.map(tab => {
                            const color = selectedColors[tab.id];
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all min-w-[140px] ${activeTab === tab.id
                                            ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full border border-gray-200 shadow-inner flex-shrink-0"
                                        style={{ backgroundColor: color?.hex || '#f3f4f6' }}
                                    >
                                        {color && (
                                            <Image
                                                src={`${r2Url}/images/colors/color-${color.id}.png`}
                                                alt=""
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover rounded-full"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{tab.label}</span>
                                        <span className="block text-sm font-bold text-gray-900">
                                            {color ? `#${color.id}` : 'Elige...'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por número o nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-600 focus:ring-0"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {filteredColors.map(color => {
                            const isSelected = selectedColors[activeTab]?.id === color.id;
                            return (
                                <button
                                    key={color.id}
                                    onClick={() => handleColorSelect(color)}
                                    className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${isSelected
                                            ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gray-100">
                                        <Image
                                            src={`${r2Url}/images/colors/color-${color.id}.png`}
                                            alt={`Color ${color.id}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                                        <span className="text-white font-bold text-sm shadow-sm">#{color.id}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                                            <Check size={12} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Confirmar Selección
                    </button>
                </div>

            </div>
        </div>
    );
};
