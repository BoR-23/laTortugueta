import React, { useEffect, useRef, useState } from 'react';
import { ColorDef, ProcessingConfig } from '@/lib/colors/types';
import { Download } from 'lucide-react';

interface ColorSampleCardProps {
    color: ColorDef;
    config: ProcessingConfig;
    onImageReady?: (id: number, dataUrl: string) => void;
}

export const ColorSampleCard: React.FC<ColorSampleCardProps> = ({ color, config, onImageReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const generatedImageRef = useRef<string | null>(null);
    const [isGenerated, setIsGenerated] = useState(false);

    useEffect(() => {
        // If textures aren't loaded or canvas isn't ready, bail
        if (!config.texture || !config.mask || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const textureImg = new Image();
        const maskImg = new Image();
        const cavityImg = config.cavityMap ? new Image() : null;
        const rimImg = config.rimLightMap ? new Image() : null;
        const shadowImg = config.contactShadowMap ? new Image() : null;

        // Determine how many images we need to wait for
        let loadedCount = 0;
        let requiredCount = 2;
        if (config.cavityMap) requiredCount++;
        if (config.rimLightMap) requiredCount++;
        if (config.contactShadowMap) requiredCount++;

        let isMounted = true;

        const handleLoad = () => {
            if (!isMounted) return;
            loadedCount++;
            if (loadedCount === requiredCount) {
                processCanvas(ctx, textureImg, maskImg, cavityImg, rimImg, shadowImg);
            }
        };

        textureImg.onload = handleLoad;
        maskImg.onload = handleLoad;
        textureImg.crossOrigin = "anonymous";
        maskImg.crossOrigin = "anonymous";
        textureImg.src = config.texture;
        maskImg.src = config.mask;

        if (cavityImg && config.cavityMap) {
            cavityImg.onload = handleLoad;
            cavityImg.crossOrigin = "anonymous";
            cavityImg.src = config.cavityMap;
        }

        if (rimImg && config.rimLightMap) {
            rimImg.onload = handleLoad;
            rimImg.crossOrigin = "anonymous";
            rimImg.src = config.rimLightMap;
        }

        if (shadowImg && config.contactShadowMap) {
            shadowImg.onload = handleLoad;
            shadowImg.crossOrigin = "anonymous";
            shadowImg.src = config.contactShadowMap;
        }

        return () => {
            isMounted = false;
        };

    }, [
        color,
        config.texture,
        config.mask,
        config.cavityMap,
        config.rimLightMap,
        config.contactShadowMap,
        config.saturation,
        config.highlightMix,
        config.shadowIntensity,
        config.midPoint,
        config.cavityIntensity,
        config.cavityMapOpacity,
        config.radiosityIntensity,
        config.rimLightIntensity,
        config.contactShadowOpacity
    ]);

    // Helper: Convert RGB to HSL, Boost Saturation, Convert back to RGB
    const getSaturatedColorAndLuma = (rgb: [number, number, number], boost: number): { rgb: [number, number, number], luma: number } => {
        let [r, g, b] = rgb;
        r /= 255; g /= 255; b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }

        // Apply Boost
        s = Math.min(1, s * boost);

        // HSL to RGB
        let r1, g1, b1;
        if (s === 0) {
            r1 = g1 = b1 = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r1 = hue2rgb(p, q, h + 1 / 3);
            g1 = hue2rgb(p, q, h);
            b1 = hue2rgb(p, q, h - 1 / 3);
        }

        const finalR = Math.round(r1 * 255);
        const finalG = Math.round(g1 * 255);
        const finalB = Math.round(b1 * 255);

        // Perceptual Luminance
        const luma = 0.299 * finalR + 0.587 * finalG + 0.114 * finalB;

        return { rgb: [finalR, finalG, finalB], luma };
    };

    const processCanvas = (
        ctx: CanvasRenderingContext2D,
        texture: HTMLImageElement,
        mask: HTMLImageElement,
        cavityImg: HTMLImageElement | null,
        rimImg: HTMLImageElement | null,
        shadowImg: HTMLImageElement | null
    ) => {
        if (!canvasRef.current) return;

        const width = texture.width;
        const height = texture.height;
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // 1. Prepare Buffers
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(texture, 0, 0, width, height);
        const textureData = tempCtx.getImageData(0, 0, width, height);
        const tData = textureData.data;

        tempCtx.clearRect(0, 0, width, height);
        tempCtx.drawImage(mask, 0, 0, width, height);
        const maskData = tempCtx.getImageData(0, 0, width, height).data;

        // 2. CONFIGURATION & AUTO-TUNE
        const { rgb: satRGB, luma: targetLuma } = getSaturatedColorAndLuma(color.rgb, config.saturation);
        const [tR, tG, tB] = satRGB;

        let localMidPoint = config.midPoint;
        let localShadowMult = config.shadowIntensity;
        let localHighlightMix = config.highlightMix;
        const isDark = targetLuma < 50;

        if (targetLuma > 200) {
            localMidPoint = Math.min(250, config.midPoint + 10);
            localHighlightMix = config.highlightMix * 0.5;
        } else if (isDark) {
            localMidPoint = Math.max(80, config.midPoint - 60);
            localHighlightMix = config.highlightMix * 1.2;
            localShadowMult = config.shadowIntensity * 0.8;
        }

        // 3. GENERATE LUT
        const lutR = new Uint8Array(256);
        const lutG = new Uint8Array(256);
        const lutB = new Uint8Array(256);

        const startR = targetLuma < 30 ? 0 : tR * localShadowMult;
        const startG = targetLuma < 30 ? 0 : tG * localShadowMult;
        const startB = targetLuma < 30 ? 0 : tB * localShadowMult;

        const highlightR = tR + (255 - tR) * localHighlightMix;
        const highlightG = tG + (255 - tG) * localHighlightMix;
        const highlightB = tB + (255 - tB) * localHighlightMix;

        const shadowAnchor = 40;
        const midAnchor = localMidPoint;

        for (let i = 0; i < 256; i++) {
            let r, g, b;
            if (i < shadowAnchor) {
                const t = i / shadowAnchor;
                r = 0 + (startR - 0) * t;
                g = 0 + (startG - 0) * t;
                b = 0 + (startB - 0) * t;
            } else if (i < midAnchor) {
                const t = (i - shadowAnchor) / (midAnchor - shadowAnchor);
                r = startR + (tR - startR) * t;
                g = startG + (tG - startG) * t;
                b = startB + (tB - startB) * t;
            } else {
                const t = (i - midAnchor) / (255 - midAnchor);
                r = tR + (highlightR - tR) * t;
                g = tG + (highlightG - tG) * t;
                b = tB + (highlightB - tB) * t;
            }
            lutR[i] = r;
            lutG[i] = g;
            lutB[i] = b;
        }

        // 4. PIXEL MANIPULATION (Gradient Map + Radiosity)
        const outputImageData = new ImageData(width, height);
        const outData = outputImageData.data;

        for (let i = 0; i < tData.length; i += 4) {
            const maskVal = maskData[i];
            const alpha = 255 - maskVal; // Black mask = Opaque Yarn

            const rIn = tData[i];
            const gIn = tData[i + 1];
            const bIn = tData[i + 2];
            const luma = Math.round(0.299 * rIn + 0.587 * gIn + 0.114 * bIn);

            if (alpha < 10) {
                // --- RADIOSITY ENGINE ---
                outData[i] = rIn;
                outData[i + 1] = gIn;
                outData[i + 2] = bIn;
                outData[i + 3] = 255;

                if (config.radiosityIntensity > 0) {
                    const pixelIndex = i / 4;
                    const y = Math.floor(pixelIndex / width);
                    const normY = y / height;
                    const gradientMask = Math.pow(normY, 3);
                    const shadowStrength = (255 - luma) / 255;

                    if (shadowStrength > 0.02 && gradientMask > 0.01) {
                        const intensity = config.radiosityIntensity * 6.0;
                        const tintFactor = Math.min(0.9, shadowStrength * gradientMask * intensity);
                        outData[i] = rIn * (1 - tintFactor) + tR * tintFactor;
                        outData[i + 1] = gIn * (1 - tintFactor) + tG * tintFactor;
                        outData[i + 2] = bIn * (1 - tintFactor) + tB * tintFactor;
                    }
                }
            } else {
                // --- YARN ENGINE (Base Color) ---
                let rOut = lutR[luma];
                let gOut = lutG[luma];
                let bOut = lutB[luma];

                // "Cavity (Texture)" - Mathematical Multiply of original texture
                if (config.cavityIntensity > 0) {
                    const texLumaNorm = luma / 255;
                    const multiplyFactor = 1 - config.cavityIntensity + (texLumaNorm * config.cavityIntensity);
                    rOut *= multiplyFactor;
                    gOut *= multiplyFactor;
                    bOut *= multiplyFactor;
                }

                // Anti-aliasing / Edge blending
                outData[i] = rOut;
                outData[i + 1] = gOut;
                outData[i + 2] = bOut;
                outData[i + 3] = 255;

                if (maskVal > 0 && maskVal < 255) {
                    const yarnRatio = alpha / 255;
                    const floorRatio = 1 - yarnRatio;
                    outData[i] = rOut * yarnRatio + rIn * floorRatio;
                    outData[i + 1] = gOut * yarnRatio + gIn * floorRatio;
                    outData[i + 2] = bOut * yarnRatio + bIn * floorRatio;
                }
            }
        }

        // 5. DRAWING & COMPOSITION
        const finalCtx = canvasRef.current.getContext('2d');
        if (finalCtx) {
            // Put the gradient map pixel data
            finalCtx.putImageData(outputImageData, 0, 0);

            // --- OPTIONAL: UPLOADED OVERLAY MAP (Last Layer - Multiply) ---
            if (cavityImg && config.cavityMapOpacity > 0) {
                finalCtx.save();
                finalCtx.globalCompositeOperation = 'multiply';
                finalCtx.globalAlpha = config.cavityMapOpacity;
                finalCtx.drawImage(cavityImg, 0, 0, width, height);
                finalCtx.restore();
            }

            // --- OPTIONAL: RIM LIGHT MAP (Over All Layers - Additive Tinted) ---
            if (rimImg && config.rimLightIntensity > 0) {
                const rimCanvas = document.createElement('canvas');
                rimCanvas.width = width;
                rimCanvas.height = height;
                const rimCtx = rimCanvas.getContext('2d');

                if (rimCtx) {
                    // 1. Fill with the Tint Color
                    // Use saturated RGB to ensure light matches vibrant yarn. 
                    // Also, enforce a minimum brightness floor so the light source isn't pitch black on dark yarns.
                    let [tintR, tintG, tintB] = satRGB;

                    // Brightness Floor for Light Source to ensure it has 'color' even on darks
                    if (targetLuma < 80) {
                        const boost = 80 - targetLuma;
                        tintR = Math.min(255, tintR + boost);
                        tintG = Math.min(255, tintG + boost);
                        tintB = Math.min(255, tintB + boost);
                    }

                    rimCtx.fillStyle = `rgb(${tintR}, ${tintG}, ${tintB})`;
                    rimCtx.fillRect(0, 0, width, height);

                    // 2. Multiply with the Rim Light Mask (White = Light, Black = None)
                    rimCtx.globalCompositeOperation = 'multiply';
                    rimCtx.drawImage(rimImg, 0, 0, width, height);

                    // 3. Composite onto main canvas using 'lighter' (Add)
                    finalCtx.save();
                    finalCtx.globalCompositeOperation = 'lighter';

                    // Inverse Intensity Curve Requested:
                    // Darks = x2 (Boost)
                    // Lights = /10 (Reduction)
                    // Interpolated based on luminance (0-255)
                    const normLuma = targetLuma / 255;
                    // Linear blend: At Black(0) -> 2.0, At White(1) -> 0.1
                    const lumaFactor = 2.0 * (1 - normLuma) + 0.1 * normLuma;

                    finalCtx.globalAlpha = Math.min(1.0, config.rimLightIntensity * lumaFactor);

                    finalCtx.drawImage(rimCanvas, 0, 0);
                    finalCtx.restore();
                }
            }

            // --- OPTIONAL: CONTACT SHADOW (Last Layer - Multiply) ---
            if (shadowImg && config.contactShadowOpacity > 0) {
                finalCtx.save();
                finalCtx.globalCompositeOperation = 'multiply';
                finalCtx.globalAlpha = config.contactShadowOpacity;
                finalCtx.drawImage(shadowImg, 0, 0, width, height);
                finalCtx.restore();
            }

            // 6. UI Overlay
            finalCtx.globalCompositeOperation = 'source-over';
            finalCtx.globalAlpha = 1.0;

            const fontSize = Math.max(16, Math.floor(width * 0.08));
            finalCtx.font = `bold ${fontSize}px Inter, sans-serif`;
            finalCtx.textAlign = 'right';
            finalCtx.textBaseline = 'bottom';

            const padding = Math.floor(width * 0.05);
            const x = width - padding;
            const y = height - padding;

            finalCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
            finalCtx.lineWidth = fontSize * 0.25;
            finalCtx.lineJoin = 'round';
            finalCtx.strokeText(`#${color.id}`, x, y);

            finalCtx.fillStyle = 'rgba(15, 23, 42, 1)';
            finalCtx.fillText(`#${color.id}`, x, y);

            const swatchRadius = fontSize * 0.6;
            const swatchX = width - padding - swatchRadius;
            const swatchY = padding + swatchRadius;

            finalCtx.beginPath();
            finalCtx.arc(swatchX, swatchY, swatchRadius, 0, 2 * Math.PI);
            finalCtx.fillStyle = color.hex;
            finalCtx.fill();
            finalCtx.strokeStyle = 'white';
            finalCtx.lineWidth = fontSize * 0.1;
            finalCtx.stroke();
            finalCtx.strokeStyle = 'rgba(0,0,0,0.1)';
            finalCtx.lineWidth = 1;
            finalCtx.stroke();
        }

        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            generatedImageRef.current = dataUrl;
            setIsGenerated(true);
            if (onImageReady) onImageReady(color.id, dataUrl);
        }
    };

    const handleDownload = () => {
        if (generatedImageRef.current) {
            const link = document.createElement('a');
            link.download = `yarn-color-${color.id}.png`;
            link.href = generatedImageRef.current;
            link.click();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="relative aspect-square bg-gray-100">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover"
                />
                {!isGenerated && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                        Processing...
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">#{color.id}</span>
                        <h3 className="font-semibold text-gray-900 leading-tight">
                            {color.marketingName || `Color ${color.id}`}
                        </h3>
                    </div>
                    <div
                        className="w-4 h-4 rounded-full border border-gray-200 shadow-inner"
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
                    />
                </div>

                {color.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {color.description}
                    </p>
                )}

                <button
                    onClick={handleDownload}
                    disabled={!isGenerated}
                    className="w-full mt-2 flex items-center justify-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 py-2 rounded-lg transition-colors"
                >
                    <Download size={14} />
                    Download
                </button>
            </div>
        </div>
    );
};
