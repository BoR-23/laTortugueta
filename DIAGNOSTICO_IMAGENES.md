# 🔍 DIAGNÓSTICO: Problema con Imágenes después de Supabase

## 📊 Análisis del Problema

### ✅ Lo que FUNCIONA:
1. **R2 está configurado correctamente** en `.env.local`:
   - `NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev`
   - Todas las variables R2 están presentes

2. **El código de conversión existe** en `src/lib/images.ts`:
   - La función `getProductImageVariant()` convierte rutas locales a URLs de R2
   - Se usa correctamente en los componentes

3. **Supabase está funcionando**:
   - Los productos se cargan desde Supabase
   - Las categorías están migradas

### ❌ El PROBLEMA:

**Las imágenes en Supabase probablemente NO tienen el formato correcto**

Cuando migraste los productos a Supabase, las URLs de las imágenes pueden estar en uno de estos formatos incorrectos:

1. **URLs completas de R2** (incorrecto):
   ```
   https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev/images/products/producto.jpg
   ```

2. **Rutas sin el prefijo correcto** (incorrecto):
   ```
   images/products/producto.jpg
   producto.jpg
   ```

**Formato CORRECTO esperado por el código:**
```
/images/products/producto.jpg
```

### 🔍 Por qué esto causa el problema:

En `src/lib/images.ts`, la función verifica:
```typescript
if (!imagePath.startsWith('/images/products/')) {
    return imagePath  // ❌ Si no empieza con esto, NO convierte a R2
}
```

Si las URLs en Supabase:
- Ya son URLs completas de R2 → No las convierte (pero pueden estar rotas)
- No empiezan con `/images/products/` → No las convierte a R2
- Están vacías o null → Devuelve string vacío

## 🎯 SOLUCIÓN

### Opción 1: Verificar y Corregir URLs en Supabase (RECOMENDADO)

Necesitas verificar qué formato tienen las URLs en tu base de datos de Supabase.

**Paso 1: Verificar el formato actual**

Ejecuta este script para ver qué formato tienen las URLs:

```javascript
// scripts/check_image_urls.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkImageUrls() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name')
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n📸 Verificando formato de URLs de imágenes:\n')

  for (const product of products) {
    const { data: assets } = await supabase
      .from('media_assets')
      .select('url')
      .eq('product_id', product.id)
      .order('position')

    console.log(`\n${product.name} (${product.id}):`)
    if (assets && assets.length > 0) {
      assets.forEach((asset, i) => {
        console.log(`  ${i + 1}. ${asset.url}`)
      })
    } else {
      console.log('  ❌ Sin imágenes')
    }
  }
}

checkImageUrls()
```

**Paso 2: Corregir URLs si es necesario**

Si las URLs NO tienen el formato `/images/products/...`, ejecuta este script para corregirlas:

```javascript
// scripts/fix_image_urls.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixImageUrls() {
  const { data: assets, error } = await supabase
    .from('media_assets')
    .select('id, url, product_id')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`\n🔧 Encontrados ${assets.length} assets para revisar\n`)

  let fixed = 0
  let skipped = 0

  for (const asset of assets) {
    let newUrl = asset.url

    // Si es una URL completa de R2, extraer solo la ruta
    if (newUrl.includes('r2.dev/')) {
      const match = newUrl.match(/r2\.dev(\/.+)$/)
      if (match) {
        newUrl = match[1]
      }
    }

    // Si no empieza con /, añadirlo
    if (!newUrl.startsWith('/')) {
      newUrl = '/' + newUrl
    }

    // Si no tiene el prefijo correcto, añadirlo
    if (!newUrl.startsWith('/images/products/')) {
      // Extraer solo el nombre del archivo
      const filename = newUrl.split('/').pop()
      newUrl = `/images/products/${asset.product_id}/${filename}`
    }

    // Actualizar si cambió
    if (newUrl !== asset.url) {
      const { error: updateError } = await supabase
        .from('media_assets')
        .update({ url: newUrl })
        .eq('id', asset.id)

      if (updateError) {
        console.error(`❌ Error actualizando ${asset.id}:`, updateError)
      } else {
        console.log(`✅ ${asset.url} → ${newUrl}`)
        fixed++
      }
    } else {
      skipped++
    }
  }

  console.log(`\n✅ Corregidas: ${fixed}`)
  console.log(`⏭️  Sin cambios: ${skipped}`)
}

fixImageUrls()
```

### Opción 2: Mejorar la función de conversión (ALTERNATIVA)

Si prefieres hacer el código más robusto para manejar diferentes formatos:

```typescript
// src/lib/images.ts - Versión mejorada
export const getProductImageVariant = (
  imagePath: string | undefined | null,
  variant: ProductImageVariant = 'original'
) => {
  if (!imagePath) {
    return ''
  }

  // Si ya es una URL completa de R2, devolverla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Normalizar la ruta para que siempre empiece con /images/products/
  let normalizedPath = imagePath
  
  // Si no empieza con /, añadirlo
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath
  }

  // Si no es una imagen de producto, devolverla tal cual
  if (!normalizedPath.startsWith('/images/products/')) {
    return normalizedPath
  }

  // Si no tenemos R2 configurado, usar ruta local
  if (!R2_PUBLIC_URL) {
    console.warn('R2_PUBLIC_URL not configured, using local images')
    return normalizedPath
  }

  // Extraer ruta relativa
  const relativePath = normalizedPath.slice('/images/products/'.length)

  if (variant === 'original') {
    return `${R2_PUBLIC_URL}/images/products/${relativePath}`
  }

  return `${R2_PUBLIC_URL}/images/products/${VARIANTS_FOLDER}/${variant}/${relativePath}`
}
```

## 🚀 Pasos Recomendados

1. **Crear el script de verificación**:
   ```bash
   # Crear el archivo
   touch scripts/check_image_urls.js
   # Copiar el código del script de verificación
   ```

2. **Ejecutar verificación**:
   ```bash
   node scripts/check_image_urls.js
   ```

3. **Si las URLs están mal, crear y ejecutar el script de corrección**:
   ```bash
   touch scripts/fix_image_urls.js
   node scripts/fix_image_urls.js
   ```

4. **Verificar en Netlify que las variables estén configuradas**:
   - Ve a Site settings > Environment variables
   - Confirma que `NEXT_PUBLIC_R2_PUBLIC_URL` está presente
   - Si falta, añádela y haz un nuevo deploy

5. **Hacer un nuevo deploy**:
   ```bash
   git add .
   git commit -m "Fix: Corregir URLs de imágenes en Supabase"
   git push
   ```

## 📝 Checklist de Verificación

- [ ] Ejecutar script de verificación de URLs
- [ ] Corregir URLs en Supabase si es necesario
- [ ] Verificar variables en Netlify
- [ ] Hacer nuevo deploy
- [ ] Verificar que las imágenes cargan correctamente

---

**Fecha**: 14/11/2025
