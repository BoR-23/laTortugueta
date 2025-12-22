
import React from 'react';

interface ThreadVisualProps {
    color: string;
    className?: string;
    vertical?: boolean;
}

export const ThreadVisual: React.FC<ThreadVisualProps> = ({ color, className = "", vertical = false }) => {
    return (
        <div className={`relative ${className}`} style={{ isolation: 'isolate' }}>
            {/* Cuerpo del Hilo: Color base sólido y limpio */}
            <div
                className="w-full h-full relative overflow-hidden"
                style={{
                    backgroundColor: color,
                    borderRadius: vertical ? '12px' : '20px',
                }}
            >
                {/* TEXTURA DE BOBINADO: Líneas finas mate que dan la identidad de hilo sin brillo */}
                <div
                    className="absolute inset-0 opacity-[0.1] mix-blend-multiply"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
              ${vertical ? '90deg' : '0deg'},
              transparent,
              transparent 1.5px,
              rgba(0,0,0,0.3) 1.5px,
              rgba(0,0,0,0.3) 2.5px
            )`,
                        backgroundSize: vertical ? '4px 100%' : '100% 4px'
                    }}
                />

                {/* Sombreado de bordes mínimo para dar volumen básico sin parecer satinado */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.08]"
                    style={{
                        background: `linear-gradient(
              ${vertical ? '180deg' : '270deg'},
              rgba(0,0,0,0.5) 0%,
              transparent 15%,
              transparent 85%,
              rgba(0,0,0,0.5) 100%
            )`
                    }}
                />
            </div>

            {/* Sombra de contacto exterior muy tenue */}
            <div
                className="absolute -bottom-1 inset-x-4 h-4 bg-black/[0.03] blur-lg rounded-full -z-10"
            />
        </div>
    );
};
