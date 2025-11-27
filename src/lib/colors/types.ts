export interface ColorDef {
    id: number;
    rgb: [number, number, number];
    hex: string;
    marketingName?: string;
    description?: string;
}

export interface ProcessingConfig {
    texture: string | null;
    mask: string | null;
    cavityMap: string | null;
    rimLightMap: string | null;
    contactShadowMap: string | null;

    blendMode: string;
    opacity: number;

    saturation: number;
    cavityIntensity: number;
    cavityMapOpacity: number;
    radiosityIntensity: number;
    shadowIntensity: number;
    midPoint: number;
    highlightMix: number;
    rimLightIntensity: number;
    contactShadowOpacity: number;
}
