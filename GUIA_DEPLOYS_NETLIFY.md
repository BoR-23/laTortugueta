# 🚀 Guía: Controlar Deploys en Netlify y Ahorrar Créditos

## 📊 Situación Actual
- Has usado el 50% de tus créditos gratuitos de Netlify
- Cada deploy (automático o manual) consume minutos de build
- Necesitas probar cambios sin gastar créditos innecesariamente

## ✅ Soluciones para Ahorrar Créditos

### Opción 1: Desactivar Auto-Deploy (RECOMENDADO)

Esto evita que Netlify haga deploy automáticamente con cada push a GitHub.

**Pasos:**
1. Ve a tu sitio en Netlify
2. **Site settings** > **Build & deploy** > **Continuous deployment**
3. En **Build settings**, haz clic en **Edit settings**
4. Desactiva **Auto publishing**
5. Guarda los cambios

**Resultado:**
- ✅ Los push a GitHub NO harán deploy automático
- ✅ Puedes hacer deploy manual solo cuando estés seguro
- ✅ Ahorras créditos en pruebas

**Para hacer deploy manual:**
- Ve a **Deploys** > **Trigger deploy** > **Deploy site**

---

### Opción 2: Usar Deploy Previews Solo para Branches

Configura Netlify para que solo haga deploy de branches específicas.

**Pasos:**
1. Ve a **Site settings** > **Build & deploy** > **Deploy contexts**
2. En **Production branch**, deja `main`
3. En **Branch deploys**, selecciona **Let me add individual branches**
4. NO añadas ninguna branch (o solo añade una branch de prueba como `preview`)

**Resultado:**
- ✅ Solo los push a `main` harán deploy
- ✅ Puedes trabajar en otras branches sin gastar créditos
- ✅ Cuando estés listo, haces merge a `main`

---

### Opción 3: Probar Localmente Antes de Deploy

La mejor forma de ahorrar créditos es probar todo localmente antes de hacer push.

**Comandos para probar localmente:**

```bash
# 1. Instalar dependencias (si no lo has hecho)
npm install

# 2. Ejecutar en modo desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:3000
```

**Verificar que todo funciona:**
- ✅ Las imágenes cargan desde R2
- ✅ Los productos se muestran correctamente
- ✅ No hay errores en la consola

**Solo cuando todo funcione localmente:**
```bash
# Hacer build de producción para verificar
npm run build

# Si el build es exitoso, hacer push
git push origin main
```

---

### Opción 4: Usar una Branch de Prueba

Trabaja en una branch separada y solo haz merge a `main` cuando estés seguro.

**Flujo de trabajo:**

```bash
# 1. Crear branch de prueba
git checkout -b pruebas-imagenes

# 2. Hacer cambios y commits
git add .
git commit -m "Prueba: ajustes de imágenes"
git push origin pruebas-imagenes

# 3. Probar localmente
npm run dev

# 4. Solo cuando funcione, hacer merge a main
git checkout main
git merge pruebas-imagenes
git push origin main
```

**Ventaja:**
- ✅ Puedes hacer muchos commits en la branch de prueba
- ✅ Solo gastas créditos cuando haces merge a `main`

---

## 🎯 Recomendación para Tu Caso

**Combinación de Opción 1 + Opción 3:**

1. **Desactiva Auto-Deploy en Netlify** (Opción 1)
2. **Prueba todo localmente** (Opción 3)
3. **Cuando estés 100% seguro, haz deploy manual**

### Pasos Específicos para Ahora:

```bash
# 1. Probar localmente que las imágenes funcionan
npm run dev

# Abre http://localhost:3000 y verifica:
# - Las imágenes cargan correctamente
# - Las URLs son correctas
# - No hay errores en consola
```

**Si funciona localmente:**
- Ve a Netlify
- Desactiva Auto-Deploy
- Haz un deploy manual solo cuando estés seguro

**Si NO funciona localmente:**
- Arregla el problema
- Prueba de nuevo
- NO hagas push hasta que funcione

---

## 📊 Monitorear Uso de Créditos

**Ver cuántos créditos te quedan:**
1. Ve a tu dashboard de Netlify
2. Haz clic en tu avatar (arriba a la derecha)
3. **User settings** > **Billing**
4. Verás el uso de minutos de build

**Plan gratuito de Netlify:**
- 300 minutos de build/mes
- Si ya usaste 150 minutos (50%), te quedan 150 minutos

**Estimación:**
- Cada build tarda ~2-3 minutos
- Te quedan ~50-75 deploys más este mes

---

## 🔧 Configuración Recomendada en netlify.toml

Puedes añadir esto a tu `netlify.toml` para controlar mejor los builds:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

# Ignorar ciertos archivos para no hacer rebuild
[build.ignore]
  # No hacer rebuild si solo cambian estos archivos
  command = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- '*.md' 'scripts/' 'data/'"
```

Esto evita rebuilds cuando solo cambias documentación o scripts.

---

## ✅ Checklist de Ahorro de Créditos

- [ ] Desactivar Auto-Deploy en Netlify
- [ ] Probar siempre localmente con `npm run dev`
- [ ] Hacer `npm run build` antes de push
- [ ] Usar branches de prueba
- [ ] Solo hacer deploy manual cuando estés seguro
- [ ] Monitorear uso de créditos regularmente

---

## 🆘 Si Te Quedas Sin Créditos

**Opciones:**
1. **Esperar al próximo mes** (se resetean los 300 minutos)
2. **Usar otro servicio gratuito temporalmente**:
   - Vercel (también tiene plan gratuito)
   - GitHub Pages (para sitios estáticos)
3. **Pagar por más minutos** (si es urgente)

---

**Última actualización**: 14/11/2025
