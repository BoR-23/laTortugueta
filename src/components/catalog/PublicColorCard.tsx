import React, { useState } from 'react';
import { ColorDef } from '@/lib/colors/types';
import { Copy, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PublicColorCardProps {
    color: ColorDef;
    priority?: boolean;
}

export const PublicColorCard: React.FC<PublicColorCardProps> = ({ color, priority = false }) => {
    const [copied, setCopied] = useState(false);
    const [imageError, setImageError] = useState(false);
    const pathname = usePathname();

    const handleCopy = () => {
        navigator.clipboard.writeText(`#${color.id}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Construct the R2 URL for the color image
    // Assuming NEXT_PUBLIC_R2_PUBLIC_URL is available
    const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev';
    const imageUrl = `${r2Url}/images/colors/color-${color.id}.png`;

    // Determine locale from pathname
    const locale = pathname.startsWith('/en') ? '/en' : pathname.startsWith('/ca') ? '/ca' : '';
    const href = `${locale}/?codes=${color.id}`;

    return (
        <Link
            href={href}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-transform duration-300 hover:scale-[2] hover:shadow-xl hover:z-50 origin-center block"
        >
            <div className="relative aspect-square bg-gray-50">
                {!imageError ? (
                    <Image
                        src={imageUrl}
                        alt={`Color ${color.id} - ${color.marketingName || ''}`}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
                        priority={priority}
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: color.hex }}
                    >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm" />
                    </div>
                )}

                {/* Hover Overlay with Copy Button - Top Right Corner */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button
                        onClick={(e) => {
                            e.preventDefault(); // Prevent navigation
                            e.stopPropagation();
                            handleCopy();
                        }}
                        className="bg-white/90 backdrop-blur text-gray-900 p-2 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
                        title="Copiar código"
                    >
                        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                            Código
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                            #{color.id}
                        </h3>
                    </div>
                    <div
                        className="w-6 h-6 rounded-full border border-gray-200 shadow-inner"
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
                    />
                </div>

                {color.marketingName && (
                    <p className="mt-2 text-sm text-gray-600 font-medium">
                        {color.marketingName}
                    </p>
                )}
            </div>
        </Link>
    );
};
