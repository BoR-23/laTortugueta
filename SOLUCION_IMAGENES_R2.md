# 🔧 Solución: Imágenes no se cargan desde R2 en Netlify

## 🔍 Diagnóstico del Problema

Las imágenes dejaron de cargarse desde Cloudflare R2 después del último deploy porque:

1. **Las URLs en Supabase son rutas locales**: `/images/products/producto_1.jpg`
2. **El código convierte estas rutas a R2**: La función `getProductImageVariant()` en `src/lib/images.ts` convierte automáticamente las rutas locales a URLs de R2
3. **PERO necesita la variable de entorno**: Si `NEXT_PUBLIC_R2_PUBLIC_URL` no está configurada, las imágenes se quedan como rutas locales

## ✅ Solución

### Verificar Variables de Entorno en Netlify

Ve a tu sitio en Netlify y verifica que estas variables estén configuradas:

**Site settings > Environment variables**

```env
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev
NEXT_PUBLIC_R2_ENDPOINT=https://2e8373325e9bca736a20710edf38f775.r2.cloudflarestorage.com
NEXT_PUBLIC_R2_ACCESS_KEY_ID=05c74489fdfd93f53fe088db850c6bc5
NEXT_PUBLIC_R2_SECRET_ACCESS_KEY=d80624bdcb7f450fabc2531187c31ecea35e3183c81a9015e8f29b9000be5dcd
NEXT_PUBLIC_R2_BUCKET_NAME=latortugueta-media
```

### ⚠️ IMPORTANTE: Variables NEXT_PUBLIC_*

Las variables que empiezan con `NEXT_PUBLIC_` deben estar configuradas en **build time** (tiempo de compilación), no solo en runtime.

**Pasos para verificar:**

1. Ve a Netlify Dashboard
2. Selecciona tu sitio
3. Ve a **Site settings** > **Environment variables**
4. Verifica que `NEXT_PUBLIC_R2_PUBLIC_URL` esté presente
5. Si no está o está mal configurada, añádela/corrígela
6. **Haz un nuevo deploy** (las variables NEXT_PUBLIC_ solo se aplican en build time)

### Cómo Funciona el Código

```typescript
// src/lib/images.ts
export const getProductImageVariant = (
  imagePath: string | undefined | null,
  variant: ProductImageVariant = 'original'
) => {
  if (!imagePath) return ''
  
  // Si no es una imagen de producto, devolverla tal cual
  if (!imagePath.startsWith('/images/products/')) {
    return imagePath
  }

  // ⚠️ AQUÍ ESTÁ LA CLAVE: Si no hay R2_PUBLIC_URL, usa rutas locales
  if (!R2_PUBLIC_URL) {
    console.warn('R2_PUBLIC_URL not configured, using local images')
    return imagePath  // ❌ Esto causa el problema en producción
  }

  // ✅ Con R2_PUBLIC_URL configurada, convierte a URL de R2
  const relativePath = imagePath.slice('/images/products/'.length)
  
  if (variant === 'original') {
    return `${R2_PUBLIC_URL}/images/products/${relativePath}`
  }

  return `${R2_PUBLIC_URL}/images/products/_variants/${variant}/${relativePath}`
}
```

## 🧪 Cómo Verificar que Está Funcionando

### 1. Verificar en el Build Log de Netlify

Busca en los logs del build si hay warnings sobre R2:
```
R2_PUBLIC_URL not configured, using local images
```

Si ves este mensaje, significa que la variable no está configurada.

### 2. Verificar en el Navegador

Abre la consola del navegador (F12) y busca:
- URLs de imágenes que empiecen con `https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev` ✅
- URLs de imágenes que empiecen con `/images/products/` ❌

### 3. Verificar en el Código Fuente de la Página

Haz clic derecho > "Ver código fuente" y busca las etiquetas `<img>`:
```html
<!-- ✅ CORRECTO -->
<img src="https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev/images/products/_variants/thumb/producto_1.jpg">

<!-- ❌ INCORRECTO -->
<img src="/images/products/producto_1.jpg">
```

## 🚀 Pasos para Resolver

1. **Verificar variables en Netlify**
   - Ve a Site settings > Environment variables
   - Confirma que `NEXT_PUBLIC_R2_PUBLIC_URL` está presente

2. **Si falta o está mal, añádela/corrígela**
   - Añade: `NEXT_PUBLIC_R2_PUBLIC_URL` = `https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev`

3. **Hacer un nuevo deploy**
   - Ve a Deploys > Trigger deploy > Deploy site
   - O haz un nuevo commit y push

4. **Verificar que funciona**
   - Abre el sitio
   - Verifica que las imágenes cargan
   - Revisa la consola del navegador

## 📝 Notas Adicionales

- Las imágenes en Supabase se guardan como rutas locales (`/images/products/...`)
- Esto es correcto y permite flexibilidad
- La conversión a R2 se hace en tiempo de renderizado
- Por eso es crítico que `NEXT_PUBLIC_R2_PUBLIC_URL` esté configurada

## ✅ Checklist de Verificación

- [ ] Variable `NEXT_PUBLIC_R2_PUBLIC_URL` configurada en Netlify
- [ ] Variable `NEXT_PUBLIC_R2_BUCKET_NAME` configurada en Netlify
- [ ] Nuevo deploy realizado después de configurar las variables
- [ ] Imágenes cargan correctamente en el sitio
- [ ] URLs de imágenes apuntan a R2 (no a rutas locales)

---

**Última actualización**: 14/11/2025
