import { Product } from './types'

const dummyProduct: Product = {
    id: "product-123-long-id-string",
    name: "Calcetines Fallera Modelo Exclusivo Seda Valenciana con Flores",
    description: "<p>Una descripción larga y detallada del producto...</p>",
    image: "https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev/images/products/calcetines-fallera-seda-001.jpg",
    gallery: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    price: 45.50,
    tags: ["seda", "valenciana", "fallera", "bordado", "tradicional", "premium", "exclusivo"],
    category: "Calcetines de Fallera",
    sizes: ["36-38", "39-41", "42-44"],
    available: true,
    priority: 100,
    viewCount: 1530,
    mediaAssets: [
        { url: "https://example.com/1.jpg", tags: ["seda", "rojo"] },
        { url: "https://example.com/1.jpg", tags: ["dorado", "detalle"] }
    ],
    metadata: {},
    color: "Rojo",
    type: "Calcetines",
    material: "Seda",
    care: "Lavar a mano",
    origin: "Valencia",
    content: "<p>Contenido adicional...</p>",
    photos: 0
};

export const getAllProducts = async (): Promise<Product[]> => {
    // Generate 250 copies
    return Array.from({ length: 250 }, (_, i) => ({
        ...dummyProduct,
        id: `product-${i}`,
        name: `${dummyProduct.name} ${i}`,
        viewCount: Math.floor(Math.random() * 2000)
    }));
}
