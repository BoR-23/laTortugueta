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
  category_id text,
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
create index if not exists media_assets_product_idx on public.media_assets (product_id, position);
create index if not exists categories_scope_idx on public.categories (scope, sort_order);
create unique index if not exists users_admin_email_idx on public.users_admin (lower(email));

alter table public.products
  add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.products
  add column if not exists view_count integer default 0;
alter table public.products
  add column if not exists last_viewed_at timestamptz;
alter table public.products
  drop column if exists category;
alter table public.products
  add column if not exists category_id text;
alter table public.products
  add constraint if not exists fk_products_category
  foreign key (category_id) references public.categories(id)
  on delete restrict;

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

create or replace function public.merge_categories(
  target_category_id text,
  source_category_ids text[]
)
returns void
language plpgsql
security definer
as $$
begin
  update public.products
  set category_id = target_category_id
  where category_id = any(source_category_ids);

  update public.categories
  set parent_id = target_category_id
  where parent_id = any(source_category_ids);

  delete from public.categories
  where id = any(source_category_ids);
end;
$$;
