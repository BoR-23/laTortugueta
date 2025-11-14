const fs = require('fs');
const path = require('path');

// Rutas críticas
const rutaPublica = path.join(process.cwd(), 'public', 'images', 'products');
const rutaVariants = path.join(rutaPublica, '_variants');

console.log('===================================================');
console.log('🕵️‍♂️  INFORME DEL INGENIERO JEFE');
console.log('===================================================');
console.log(`📍 Directorio base (CWD): ${process.cwd()}`);
console.log(`Buscando imágenes en: ${rutaPublica}`);

// 1. Verificar carpeta principal
if (fs.existsSync(rutaPublica)) {
    console.log('✅ La carpeta "products" EXISTE.');

    const archivos = fs.readdirSync(rutaPublica);
    const fotos = archivos.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

    console.log(`📂 Total archivos encontrados: ${archivos.length}`);
    console.log(`🖼️  Total imágenes válidas: ${fotos.length}`);

    if (fotos.length > 0) {
        console.log('📋 Primeras 5 imágenes detectadas:');
        fotos.slice(0, 5).forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('⚠️  ALERTA: La carpeta existe pero NO CONTIENE IMÁGENES.');
    }
} else {
    console.log('❌ ERROR CRÍTICO: La carpeta "public/images/products" NO EXISTE.');
}

console.log('---------------------------------------------------');

// 2. Verificar carpeta de variantes (necesaria para la web)
if (fs.existsSync(rutaVariants)) {
    console.log('✅ La carpeta "_variants" EXISTE.');
} else {
    console.log('⚠️  ADVERTENCIA: Falta la carpeta "_variants". Las miniaturas fallarán.');
}
console.log('===================================================');
