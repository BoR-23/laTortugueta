
import React, { useState } from 'react';
import { ColorDef } from '@/lib/colors/types';
import { ThreadVisual } from './ThreadVisual';
import { Check, Copy } from 'lucide-react';

interface ThreadCardProps {
    color: ColorDef;
    onClick: (color: ColorDef) => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ color, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={() => onClick(color)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="bg-white rounded-[1.2rem] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)] transition-all duration-300 cursor-pointer group border border-slate-100/50 flex flex-col h-full"
            role="button"
            tabIndex={0}
            title={`Ver detalles del color ${color.id} - ${color.marketingName || ''}`}
            aria-label={`Color ${color.id} ${color.marketingName || ''}`}
        >
            {/* Contenedor del Hilo con fondo suave */}
            <div className="relative mb-5 flex items-center justify-center h-[110px] rounded-xl bg-slate-50/50">
                <ThreadVisual
                    color={color.hex}
                    className={`h-[80px] w-full max-w-[110px] z-10 transition-transform duration-500 ${isHovered ? 'scale-105' : ''}`}
                />
            </div>

            <div className="mt-auto">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase">Referencia</span>
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color.hex }}
                    />
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">
                        #{color.id}
                    </h3>
                    <span className="text-[9px] font-mono text-slate-400 font-medium">
                        {color.hex.toUpperCase()}
                    </span>
                </div>
                {color.marketingName && (
                    <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-1">{color.marketingName}</p>
                )}
            </div>
        </div>
    );
};
