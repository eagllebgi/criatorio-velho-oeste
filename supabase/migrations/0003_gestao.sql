-- Criatório Velho Oeste — gestão interna (financeiro, baias, aves, postura)
-- Tabelas novas: financeiro, baias, baia_observacoes, aves, lotes_postura
-- Todas admin-only: sem política de leitura pública (nada aqui aparece no
-- catálogo/site público — são ferramentas internas de uso diário do criador).
-- Também adiciona products.product_type para permitir vender aves vivas
-- reaproveitando 100% da estrutura de catálogo já existente (ovos + aves).

-- ---------------------------------------------------------------------------
-- products.product_type — ovo (padrão, mantém tudo existente) ou ave
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists product_type text not null default 'ovo'
  check (product_type in ('ovo', 'ave'));

create index if not exists products_product_type_idx on public.products (product_type);

comment on column public.products.product_type is 'Tipo do item à venda no catálogo: ovo fértil ou ave viva.';

-- ---------------------------------------------------------------------------
-- financeiro — lançamentos simples de entrada/saída (caixa do mês)
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  categoria text,
  valor numeric(10, 2) not null check (valor >= 0),
  data date not null default current_date,
  created_at timestamptz not null default now()
);

comment on table public.financeiro is 'Lançamentos manuais de entrada/saída — caixa do mês, uso interno do admin.';

create index if not exists financeiro_data_idx on public.financeiro (data);
create index if not exists financeiro_tipo_idx on public.financeiro (tipo);

-- ---------------------------------------------------------------------------
-- baias — viveiros/plantéis onde ficam as aves
-- ---------------------------------------------------------------------------
create table if not exists public.baias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  numero text not null,
  nome text not null,
  especie text not null,
  setor text,
  status text not null default 'Ativa' check (status in ('Reprodução', 'Ativa', 'Inativa')),
  preco_ovo numeric(10, 2) check (preco_ovo is null or preco_ovo >= 0),
  destino_padrao text not null default 'venda' check (destino_padrao in ('venda', 'choc', 'reservado', 'descarte')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.baias is 'Viveiros/baias de criação — controle interno de produção, não visível ao público.';

create index if not exists baias_status_idx on public.baias (status);

drop trigger if exists set_baias_updated_at on public.baias;
create trigger set_baias_updated_at
  before update on public.baias
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- baia_observacoes — histórico de observações por baia
-- ---------------------------------------------------------------------------
create table if not exists public.baia_observacoes (
  id uuid primary key default gen_random_uuid(),
  baia_id uuid not null references public.baias(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create index if not exists baia_observacoes_baia_id_idx on public.baia_observacoes (baia_id);

-- ---------------------------------------------------------------------------
-- aves — plantel individual (aves vivas, reprodutoras ou não)
-- ---------------------------------------------------------------------------
create table if not exists public.aves (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  baia_id uuid references public.baias(id) on delete set null,
  nome text not null,
  emoji text not null default '🐓',
  sexo text not null default 'Indefinido' check (sexo in ('Macho', 'Fêmea', 'Casal', 'Indefinido')),
  status text not null default 'Filhote' check (
    status in (
      'Filhote', 'Disponível', 'Reprodutor', 'Macho reprodutor', 'Fêmea reprodutora',
      'Matriz', 'Reservado', 'Vendido', 'Separado', 'Óbito'
    )
  ),
  data_nascimento date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.aves is 'Plantel individual de aves — controle interno de produção, não visível ao público.';

create index if not exists aves_baia_id_idx on public.aves (baia_id);
create index if not exists aves_status_idx on public.aves (status);

drop trigger if exists set_aves_updated_at on public.aves;
create trigger set_aves_updated_at
  before update on public.aves
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lotes_postura — lotes de ovos postos, com fluxo até chocadeira/venda
-- ---------------------------------------------------------------------------
create table if not exists public.lotes_postura (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  baia_id uuid not null references public.baias(id) on delete cascade,
  quantidade integer not null check (quantidade >= 0),
  preco_unit numeric(10, 2) check (preco_unit is null or preco_unit >= 0),
  data_postura date not null default current_date,
  destino text not null default 'venda' check (destino in ('venda', 'choc', 'reservado', 'descarte')),
  status text not null default 'Disponível' check (
    status in ('Disponível', 'Incubando', 'Reservado', 'Vendido', 'Concluído', 'Descartado')
  ),
  eclosao_prevista date,
  lote_origem_id uuid references public.lotes_postura(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lotes_postura is 'Lotes de ovos por postura — pipeline disponível → chocadeira → nascimento/venda. Controle interno.';

create index if not exists lotes_postura_baia_id_idx on public.lotes_postura (baia_id);
create index if not exists lotes_postura_status_idx on public.lotes_postura (status);
create index if not exists lotes_postura_data_postura_idx on public.lotes_postura (data_postura);

drop trigger if exists set_lotes_postura_updated_at on public.lotes_postura;
create trigger set_lotes_postura_updated_at
  before update on public.lotes_postura
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — tudo acima é admin-only (sem leitura pública)
-- ---------------------------------------------------------------------------
alter table public.financeiro enable row level security;
alter table public.baias enable row level security;
alter table public.baia_observacoes enable row level security;
alter table public.aves enable row level security;
alter table public.lotes_postura enable row level security;

drop policy if exists "financeiro_admin_all" on public.financeiro;
create policy "financeiro_admin_all"
  on public.financeiro for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "baias_admin_all" on public.baias;
create policy "baias_admin_all"
  on public.baias for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "baia_observacoes_admin_all" on public.baia_observacoes;
create policy "baia_observacoes_admin_all"
  on public.baia_observacoes for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "aves_admin_all" on public.aves;
create policy "aves_admin_all"
  on public.aves for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "lotes_postura_admin_all" on public.lotes_postura;
create policy "lotes_postura_admin_all"
  on public.lotes_postura for all
  to authenticated
  using (true)
  with check (true);
