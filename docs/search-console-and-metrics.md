# Monitoreo y métricas para La Tortugueta

Esta guía recopila todo lo necesario para dar de alta la web en Search Console, activar un servicio de sesión/heatmaps (p. ej. Microsoft Clarity) y verificar que los Web Vitals se están registrando.

## 1. Verificar la web en Google Search Console

1. Entra en https://search.google.com/search-console con la cuenta de Google del proyecto.
2. Elige “Propiedad de Dominio” si tienes acceso a los DNS (recomendado) o “Prefijo de URL”.
3. **Dominio**: `latortugueta.com`.
4. Copia el token de verificación DNS que ofrece Google preformateado así:

```
google-site-verification=xxxxxxxxxxxxxxxx
```

5. Añádelo en tu proveedor DNS (el mismo donde está configurado Netlify). Tipo `TXT`, host raíz, valor el token anterior.
6. Espera unos minutos y pulsa “Verificar”.
7. Una vez verificada la propiedad, sube un sitemap completo (`/sitemap.xml`) — Search Console lo detectará automáticamente, pero puedes añadir el endpoint manualmente.

### Nota si no tienes acceso DNS

Google permite otras opciones (fichero HTML o meta tag). En Netlify es más sencillo usar la opción `META`:

1. Copia el fragmento `<meta name="google-site-verification" content="xxxxx" />`.
2. Anótalo en `src/app/layout.tsx` dentro del `<head>` (no lo incluimos por defecto para evitar datos duros).
3. Subir cambios y re-deploy. Tras verificar, **puedes dejar la meta** para futuras re-verificaciones.

## 2. Integrar Microsoft Clarity / Hotjar (al gusto)

Tanto Clarity como Hotjar requieren inyectar un pequeño script en el `<head>`. Ya que Next 15 usa app router, recomendamos crear un componente `TrackingScripts` dentro de `src/components/layout` e importarlo en `layout.tsx`.

### Ejemplo Clarity

```tsx
'use client'
import Script from 'next/script'

export function TrackingScripts() {
  if (!process.env.NEXT_PUBLIC_CLARITY_ID) return null
  return (
    <Script
      id="clarity-snippet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(
          function(c,l,a,r,i,t,y){
            c[a] = c[a] || function(){ (c[a].q = c[a].q || []).push(arguments) }
            t=l.createElement(r); t.async=1; t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y);
          })(window, document, 'clarity', 'script', '${process.env.NEXT_PUBLIC_CLARITY_ID}');`
      }}
    />
  )
}
```

En `src/app/layout.tsx` añadir:

```tsx
import { TrackingScripts } from '@/components/layout/TrackingScripts'
...
<body className={inter.className}>
  <TrackingScripts />
  ...
</body>
```

> **Variables en Netlify:** añade `NEXT_PUBLIC_CLARITY_ID` con el ID real.

Hotjar se integra de forma similar, cambiando el snippet.

## 3. Web Vitals

Ya tenemos `src/app/reportWebVitals.ts` que envía métricas a Google Analytics (gtag) si está definido `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Requisitos:

1. Define `NEXT_PUBLIC_GA_MEASUREMENT_ID` en entornos (formato `G-XXXX`).
2. Revisa en GA4 → Reports → Engagement → Events. Deberías ver eventos `CLS`, `LCP`, `FID` etc. con la categoría `web-vital`.
3. Si prefieres un endpoint propio, modifica `logWebVital()` en `src/lib/webVitals.ts` para usar `fetch('/api/web-vitals', ...)`.

### Endpoint opcional

```
// src/app/api/web-vitals/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const metric = await request.json()
  console.log('[web-vital]', metric)
  return NextResponse.json({ ok: true })
}
```

Y sustituye el cuerpo de `logWebVital()` por el `fetch`. Recuerda activar logging sólo en entornos seguros.

## 4. Checklist de monitorización

- [ ] Search Console verificado y sitemap añadido.
- [ ] `NEXT_PUBLIC_CLARITY_ID` o similar configurado si se usa Clarity/Hotjar.
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` definido para registrar Web Vitals en GA.
- [ ] Revisar periódicamente los informes de Search Console (cobertura, Core Web Vitals) y ajustar en consecuencia.

## 5. Analítica propia en Supabase

Además del registro en GA/Clarity, la web guarda cada vista de producto en Supabase (tabla `products`, columnas `view_count` y `last_viewed_at`). El endpoint `/api/analytics/product-view` incrementa estos contadores y se invoca automáticamente desde `registerProductView`.

- El campo `view_count` se utiliza para ordenar sugerencias, mostrar productos más vistos en el panel de administración y preparar futuras automatizaciones.
- Si necesitas rehacer el histórico, puedes ejecutar manualmente en Supabase:

```sql
update public.products
set view_count = 0,
    last_viewed_at = null;
```

- Para paneles personalizados (Looker Studio, Metabase...), basta con exponer la tabla `products` y filtrar por `view_count` o `last_viewed_at`.

> **Importante**: Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurado en Netlify, ya que el endpoint usa ese secreto para actualizar los contadores.

## 6. Eventos disponibles (GA / dataLayer)

Los siguientes eventos se envían con `trackEvent()` a `window.dataLayer`, por lo que GA4 / GTM pueden recogerlos directamente:

| Evento | Cuándo se dispara | Propiedades |
| --- | --- | --- |
| `product_view` | Cada vez que alguien abre una ficha de producto (además incrementa `view_count` en Supabase) | `productId` |
| `whatsapp_cta` | Click en el botón principal “Reservar vía WhatsApp” en una ficha | `productId` |
| `suggestion_click` | Click en un producto sugerido desde otra ficha | `source` (producto actual), `target` (sugerido) |
| `suggestion_view_more` | Click en “Ver todo” del bloque de sugeridos | `productId` |
| `filter_interaction` | Al activar o limpiar un filtro desde el panel lateral | `filterId`, `action` (`select` o `clear`) |
| `testimonial_group_select` | Seleccionando manualmente un bloque de testimonios | `groupId` |
| `cta_click` | CTA genéricas en secciones de marketing (testimonios, highlights) | `location`, `target`/`highlightId` según el origen |

Si necesitas crear objetivos en GA4:
1. Añade etiquetas (Events) usando el nombre exacto del evento.
2. Para diferenciar CTA por sección, usa las propiedades (`location`, `target`, etc.).
3. Si trabajas con GTM, crea un trigger “Custom Event” usando el mismo nombre y reenvíalo a GA4.

Con esto, tienes la base de monitorización completa y documentada dentro del repo (`docs/search-console-and-metrics.md`).
