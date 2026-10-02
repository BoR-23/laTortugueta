create or replace view public.catalog_products
with (security_invoker = true)
as
with media_summary as (
  select
    product_id,
    (array_agg(url order by position nulls last, url))[1] as image,
    count(*)::integer as photos
  from public.media_assets
  group by product_id
), media_tag_summary as (
  select
    media_assets.product_id,
    array_agg(distinct tag.value order by tag.value) as image_tags
  from public.media_assets
  cross join lateral unnest(coalesce(media_assets.tags, array[]::text[])) as tag(value)
  group by media_assets.product_id
)
select
  products.id,
  products.name,
  products.price,
  products.tags,
  products.sizes,
  products.available,
  products.priority,
  products.view_count,
  products.updated_at,
  media_summary.image,
  coalesce(media_summary.photos, 0) as photos,
  coalesce(media_tag_summary.image_tags, array[]::text[]) as image_tags
from public.products
left join media_summary on media_summary.product_id = products.id
left join media_tag_summary on media_tag_summary.product_id = products.id;

grant select on public.catalog_products to anon, authenticated, service_role;
