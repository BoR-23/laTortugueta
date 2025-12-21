const fs = require('fs');

const dummyProduct = {
    id: "product-123-long-id-string",
    name: "Calcetines Fallera Modelo Exclusivo Seda Valenciana",
    image: "https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev/images/products/calcetines-fallera-seda-001.jpg",
    price: 45.50,
    tags: ["seda", "valenciana", "fallera", "bordado", "tradicional", "premium", "exclusivo"],
    category: "Calcetines de Fallera",
    sizes: ["36-38", "39-41", "42-44"],
    available: true,
    priority: 100,
    viewCount: 1530,
    imageTags: ["seda", "rojo", "dorado", "detalle"]
};

const count = 250;
const catalog = Array(count).fill(dummyProduct);

const json = JSON.stringify(catalog);
const sizeBytes = Buffer.byteLength(json, 'utf8');
const sizeMB = sizeBytes / (1024 * 1024);

console.log(`Estimated JSON size for ${count} products: ${sizeMB.toFixed(4)} MB`);
console.log(`Size per product: ${(sizeBytes / count).toFixed(0)} bytes`);
