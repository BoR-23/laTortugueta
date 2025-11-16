# La Tortugueta - Tienda Online

Next.js con Supabase y NextAuth.

## Setup Local
1. npm install
2. Copia .env.example a .env y llena vars.
3. npm run dev

## Despliegue Cloudflare
npm run deploy

## Scripts de migración

Para evitar sobrescribir datos recientes del panel de administración, los scripts que escriben en
Supabase están desactivados por defecto. Si realmente necesitas rehacer la base de datos a partir
del markdown histórico, ejecuta el script con `ALLOW_SUPABASE_MIGRATION=1` en tu entorno.
