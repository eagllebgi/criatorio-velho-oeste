-- Criatório Velho Oeste — schema inicial
-- Tabelas: categories, products, product_images
-- RLS: leitura pública de itens ativos; escrita apenas para usuários autenticados
--      (o painel /admin só permite login para a conta do administrador criada
--      manualmente no Supabase — não há cadastro público).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Categorias do catálogo (ex: Angolas, Faisões, Pavões).';

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  short_description text,
  description text,
  price numeric(10, 2) check (price is null or price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  main_image text,
  active boolean not null default false,
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Raças / ovos férteis vendidos no catálogo.';

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);
create index if not exists products_featured_idx on public.products (featured);
create index if not exists products_display_order_idx on public.products (display_order);

-- ---------------------------------------------------------------------------
-- product_images (galeria adicional além de main_image)
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Leitura pública: qualquer visitante pode ler categorias ativas
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (active = true);

-- Leitura pública: qualquer visitante pode ler produtos ativos
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (active = true);

-- Leitura pública: imagens de produtos ativos
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.active = true
    )
  );

-- Administração: qualquer usuário autenticado (conta do Criatório) tem CRUD
-- completo. Como não há cadastro público, toda conta autenticada é confiável.
drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_admin_all"
  on public.product_images for all
  to authenticated
  using (true)
  with check (true);
