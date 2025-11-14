# Guía de Deploy en Netlify - laTortugueta

## ✅ Estado Actual del Proyecto

La migración de datos a Supabase está **COMPLETAMENTE FINALIZADA**:

- ✅ **Productos**: Migrados exitosamente a Supabase
- ✅ **Categorías**: Migradas exitosamente (73/73 categorías)
- ✅ **Script de migración de categorías**: Creado y funcionando correctamente
- ✅ **Base de datos**: Todas las tablas actualizadas correctamente

## 🚀 Configuración de Variables de Entorno en Netlify

Antes del deploy, configura estas variables de entorno en tu sitio de Netlify:

### 1. Variables Obligatorias - Cloudflare R2

```env
# CLOUDFLARE R2 (OBLIGATORIO)
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-6d7cc19d77b44520a5ac19e77cb47c4e.r2.dev
NEXT_PUBLIC_R2_ENDPOINT=https://2e8373325e9bca736a20710edf38f775.r2.cloudflarestorage.com
NEXT_PUBLIC_R2_ACCESS_KEY_ID=05c74489fdfd93f53fe088db850c6bc5
NEXT_PUBLIC_R2_SECRET_ACCESS_KEY=d80624bdcb7f450fabc2531187c31ecea35e3183c81a9015e8f29b9000be5dcd
NEXT_PUBLIC_R2_BUCKET_NAME=latortugueta-media
```

### 2. Variables Obligatorias - Supabase

```env
# SUPABASE (OBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://kyuakonrlxpqxpetyqxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dWFrb25ybHhwcXhwZXR5cXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTIxNTMsImV4cCI6MjA3ODY4ODE1M30.dSW-XH-4dGHu9m96RHwVirb38tNQHUyvWEyheOzsUN4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dWFrb25ybHhwcXhwZXR5cXhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzExMjE1MywiZXhwIjoyMDc4Njg4MTUzfQ.llCaPdcfuElQjCS1tT7Na048rLbhrF1LNPTmnsx2P00
```

### 3. Variables Obligatorias - NextAuth

```env
# NEXTAUTH (OBLIGATORIO)
NEXTAUTH_URL=https://tu-sitio.netlify.app  # ⚠️ CAMBIAR por tu URL de Netlify
NEXTAUTH_SECRET=9b6a34f81a63d94f6c59a8b7d7a1f0e3b04f3d7c218a56d2c3f87a1269db41e1
```

**IMPORTANTE**: Reemplaza `https://tu-sitio.netlify.app` con la URL real de tu sitio en Netlify.

### 4. Variables Opcionales - Google Analytics

```env
# GOOGLE ANALYTICS (OPCIONAL)
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Descomenta y añade tu ID si usas GA
```

## 📋 Pasos para Configurar Netlify

### 1. Acceder a la Configuración de Variables

1. Ve al dashboard de tu sitio en Netlify
2. Selecciona **Site settings** > **Environment variables**
3. Haz clic en **Add a variable** para cada grupo

### 2. Configurar Build Settings

En **Site settings** > **Build & deploy**:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `20`

### 3. Configurar el Plugin Next.js

El archivo `netlify.toml` ya incluye la configuración necesaria:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"
```

## 🔧 Scripts Disponibles

- **Migrar categorías a Supabase**: `node scripts/migrate_categories_to_supabase.js`
- **Migrar productos a Supabase**: `node scripts/migrate_products_to_supabase.js`

## ✅ Verificación Pre-Deploy

Antes de hacer el deploy, verifica que:

1. ✅ Todas las variables de entorno están configuradas
2. ✅ `NEXTAUTH_URL` tiene la URL correcta de tu sitio
3. ✅ Los scripts de migración se han ejecutado correctamente
4. ✅ El build local funciona: `npm run build`

## 🌐 Deploy Final

1. **Conectar el repositorio** en Netlify
2. **Configurar las variables de entorno** como se indica arriba
3. **Hacer deploy** desde Netlify (se ejecutará automáticamente)

## 🆘 Troubleshooting

### Error: "Could not find 'order' column"
- ✅ **SOLUCIONADO**: El script de migración ahora usa `sort_order`

### Error: Foreign key constraint violations
- ✅ **SOLUCIONADO**: El script ahora inserta padres antes que hijos

### Error: Variables de entorno faltantes
- Verifica que todas las variables estén configuradas en Netlify
- Asegúrate de que `NEXTAUTH_URL` tenga la URL correcta

## 📊 Estado Final

Después del deploy, verifica que:
- La web carga correctamente
- Los productos se muestran desde Supabase
- Las categorías y filtros funcionan
- Las imágenes de productos cargan desde Cloudflare R2

---

**✅ TODO LISTO PARA DEPLOY!**
