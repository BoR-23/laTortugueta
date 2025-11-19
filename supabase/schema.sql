create extension if not exists "pgcrypto" with schema public;

create table if not exists public.categories (
  id text primary key,
  scope text not null check (scope in ('header', 'filter')),
  name text not null,
  tag_key text,
  parent_id text references public.categories(id) on delete cascade,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  price numeric(10,2) default 0,
  color text,
  type text,
  material text,
  care text,
  origin text,
  tags jsonb default '[]'::jsonb,
  sizes jsonb default '[]'::jsonb,
  photos integer default 0,
  available boolean default false,
  priority integer default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.products(id) on delete cascade,
  url text not null,
  position integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.users_admin (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create unique index if not exists products_slug_idx on public.products (id);
create index if not exists products_tags_gin_idx on public.products using gin (tags);
create index if not exists media_assets_product_idx on public.media_assets (product_id, position);
create index if not exists categories_scope_idx on public.categories (scope, sort_order);
create unique index if not exists users_admin_email_idx on public.users_admin (lower(email));

alter table public.media_assets
  drop constraint if exists media_assets_url_format_check;
alter table public.media_assets
  add constraint media_assets_url_format_check check (url ~ '^(/|https?://)');

alter table public.products
  add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.products
  add column if not exists view_count integer default 0;
alter table public.products
  add column if not exists last_viewed_at timestamptz;
alter table public.products
  drop column if exists category;
alter table public.products
  drop column if exists category_id;
alter table public.products
  drop constraint if exists fk_products_category;

create or replace function public.increment_product_view(p_product_id text)
returns void
language plpgsql
as $$
begin
  update public.products
  set view_count = coalesce(view_count, 0) + 1,
      last_viewed_at = now()
  where id = p_product_id;
end;
$$;

create or replace function public.rename_product_tag(old_tag text, new_tag text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  if old_tag is null or new_tag is null or old_tag = new_tag then
    return 0;
  end if;

  update public.products
  set tags = (
    select coalesce(
      jsonb_agg(
        case when elem = old_tag then new_tag else elem end
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements_text(coalesce(tags, '[]'::jsonb)) as t(elem)
  )
  where coalesce(tags, '[]'::jsonb) @> jsonb_build_array(old_tag);

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Row Level Security configuration
alter table if exists public.products enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.media_assets enable row level security;

drop policy if exists "Permitir lectura pública de productos" on public.products;
create policy "Permitir lectura pública de productos"
  on public.products
  for select
  using (true);

drop policy if exists "Permitir lectura pública de categorías" on public.categories;
create policy "Permitir lectura pública de categorías"
  on public.categories
  for select
  using (true);

drop policy if exists "Permitir lectura pública de media" on public.media_assets;
create policy "Permitir lectura pública de media"
  on public.media_assets
  for select
  using (true);
