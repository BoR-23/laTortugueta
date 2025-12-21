
const { getAllProducts } = require('../src/lib/products/repository');
const { prepareCatalogProducts } = require('../src/components/catalog/prepareCatalogProducts');

async function inspect() {
    console.log('Fetching products...');
    const products = await getAllProducts();
    console.log(`Fetched ${products.length} products.`);

    const catalog = prepareCatalogProducts(products);
    const json = JSON.stringify(catalog);
    const sizeMB = Buffer.byteLength(json, 'utf8') / (1024 * 1024);

    console.log(`Total JSON Payload Size: ${sizeMB.toFixed(2)} MB`);

    // Inspect individual fields for massive size
    if (products.length > 0) {
        const p = products[0];
        console.log('Sample Product keys:', Object.keys(p));

        // Check if any specific field is huge
        products.forEach(prod => {
            Object.entries(prod).forEach(([key, val]) => {
                const fieldSize = Buffer.byteLength(JSON.stringify(val) || '', 'utf8');
                if (fieldSize > 10000) { // Warn if > 10KB
                    console.log(`[WARNING] Product ${prod.id} field '${key}' is ${fieldSize} bytes`);
                }
            });
        });
    }
}

inspect().catch(console.error);
