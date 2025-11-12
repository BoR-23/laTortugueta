create extension if not exists "pgcrypto" with schema public;

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
  category text,
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

create unique index if not exists products_slug_idx on public.products (id);
create index if not exists media_assets_product_idx on public.media_assets (product_id, position);
create unique index if not exists users_admin_email_idx on public.users_admin (lower(email));

alter table public.products
  add column if not exists metadata jsonb default '{}'::jsonb;

comment on table public.products is 'Catálogo principal de productos';
comment on table public.media_assets is 'Galerías asociadas a cada producto';
comment on table public.users_admin is 'Usuarios autorizados para acceder al panel';
