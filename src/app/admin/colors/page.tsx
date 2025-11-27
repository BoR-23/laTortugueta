'use client'

import React, { useState } from 'react';
import { YARN_COLORS } from '@/lib/colors/constants';
import { ProcessingConfig } from '@/lib/colors/types';
import { ColorSampleCard } from '@/components/admin/colors/ColorSampleCard';
import { Wand2 } from 'lucide-react';

export default function AdminColorsPage() {
    const [config] = useState<ProcessingConfig>({
        texture: '/images/color-generator/Texture.png',
        mask: '/images/color-generator/Mask.png',
        cavityMap: '/images/color-generator/Overlay.png',
        rimLightMap: '/images/color-generator/rimLight.png',
        contactShadowMap: '/images/color-generator/shadow.png',
        blendMode: 'multiply',
        opacity: 1,
        saturation: 1.0,
        cavityIntensity: 1.0,
        cavityMapOpacity: 1.0,
        radiosityIntensity: 0.35, // Floor bounce
        shadowIntensity: 1.0,


        highlightMix: 0.15,
        rimLightIntensity: 0.2,
        contactShadowOpacity: 1.0,
        midPoint: 201, // Defaulting to app default, can be adjusted.
    });

    const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});

    const handleImageReady = (id: number, dataUrl: string) => {
        setGeneratedImages(prev => ({ ...prev, [id]: dataUrl }));
    };

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    const handleUploadAll = async () => {
        const imagesToUpload = Object.entries(generatedImages);
        if (imagesToUpload.length === 0) {
            alert('No images generated yet. Please wait for processing.');
            return;
        }

        setIsUploading(true);
        setUploadProgress({ current: 0, total: imagesToUpload.length });

        let successCount = 0;
        let failCount = 0;

        for (const [id, dataUrl] of imagesToUpload) {
            try {
                const response = await fetch('/api/admin/colors/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ colorId: id, image: dataUrl }),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`Failed to upload color ${id}`);
                }
            } catch (err) {
                failCount++;
                console.error(`Error uploading color ${id}:`, err);
            }
            setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }

        setIsUploading(false);
        alert(`Upload complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Generador de Catálogo de Colores</h1>
                        <p className="text-gray-500">Genera y sube las imágenes de los hilos para la web.</p>
                    </div>
                    <button
                        onClick={handleUploadAll}
                        disabled={isUploading || Object.keys(generatedImages).length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isUploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                    >
                        <Wand2 size={20} className={isUploading ? 'animate-spin' : ''} />
                        {isUploading
                            ? `Subiendo ${uploadProgress.current}/${uploadProgress.total}...`
                            : 'Subir Catálogo a la Web'}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {YARN_COLORS.map((color) => (
                        <ColorSampleCard
                            key={color.id}
                            color={color}
                            config={config}
                            onImageReady={handleImageReady}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
