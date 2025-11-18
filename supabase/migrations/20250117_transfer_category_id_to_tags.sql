-- Copia la categoría asignada a cada producto como una etiqueta antes de
-- eliminar la columna category_id. Ejecutar ANTES de aplicar el schema actualizado.

begin;

with category_tags as (
  select
    p.id as product_id,
    c.tag_key
  from public.products p
  join public.categories c on c.id = p.category_id
  where c.tag_key is not null
    and length(trim(c.tag_key)) > 0
)
update public.products as p
set tags =
  case
    when coalesce(p.tags, '[]'::jsonb) @> jsonb_build_array(ct.tag_key)
      then coalesce(p.tags, '[]'::jsonb)
    else coalesce(p.tags, '[]'::jsonb) || jsonb_build_array(ct.tag_key)
  end
from category_tags ct
where ct.product_id = p.id;

commit;
