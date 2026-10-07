-- Deixa a regra de frescor de ovos (até quantos dias dá pra enviar pra
-- qualquer estado, até quantos dias só dá pra garantir dentro do estado do
-- criador) configurável pelo próprio admin, em vez de fixa em 5/7/SP como
-- veio em 0009_frescor_ovos_perfil.sql — cada criador usa um prazo
-- diferente dependendo de onde fica e de como costuma enviar.
--
-- Tabela "singleton" (uma linha só, sempre a mesma) — padrão comum pra
-- guardar configuração geral do site sem precisar de uma tabela de
-- key/value. O "id boolean ... check (id)" só existe pra impedir, no nível
-- do banco, que alguém insira uma segunda linha por engano.
create table if not exists public.configuracoes (
  id boolean primary key default true,
  dias_frescor_nacional integer not null default 5,
  dias_frescor_local integer not null default 7,
  uf_local text not null default 'SP',
  updated_at timestamptz not null default now(),
  constraint configuracoes_singleton check (id),
  constraint configuracoes_dias_validos check (dias_frescor_nacional >= 0 and dias_frescor_local >= dias_frescor_nacional),
  constraint configuracoes_uf_valida check (uf_local ~ '^[A-Z]{2}$')
);

insert into public.configuracoes (id) values (true) on conflict (id) do nothing;

alter table public.configuracoes enable row level security;

-- Só o admin logado lê/edita a configuração direto na tabela (tela
-- /admin/configuracoes) — mesmo padrão das outras tabelas de gestão interna
-- (ver 0003_gestao.sql).
create policy "configuracoes_select_authenticated" on public.configuracoes
  for select to authenticated using (true);

create policy "configuracoes_update_authenticated" on public.configuracoes
  for update to authenticated using (true) with check (true);

-- O carrinho do site público (sem login) continua precisando saber os 3
-- valores pra montar o aviso de frescor por CEP — função security definer
-- liberada pra "anon" (mesmo padrão de ovo_freshness_buckets), devolvendo
-- só os 3 valores de configuração, nunca a tabela inteira.
create or replace function public.get_frescor_config()
returns table (
  dias_frescor_nacional integer,
  dias_frescor_local integer,
  uf_local text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select dias_frescor_nacional, dias_frescor_local, uf_local from public.configuracoes limit 1;
$$;

grant execute on function public.get_frescor_config() to anon, authenticated;

-- Troca os números fixos (5 e 7) de ovo_freshness_buckets pelos valores
-- configurados em `configuracoes` — o resto da função (como soma os lotes
-- disponíveis pra venda por espécie) continua igual a 0009.
create or replace function public.ovo_freshness_buckets(p_especie text)
returns table (
  qtd_ate_5 integer,
  qtd_ate_7 integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce(
      sum(case when (current_date - lp.data_postura) <= cfg.dias_frescor_nacional then lp.quantidade else 0 end),
      0
    )::integer as qtd_ate_5,
    coalesce(
      sum(case when (current_date - lp.data_postura) > cfg.dias_frescor_nacional
                and (current_date - lp.data_postura) <= cfg.dias_frescor_local
               then lp.quantidade else 0 end),
      0
    )::integer as qtd_ate_7
  from public.lotes_postura lp
  join public.baias b on b.id = lp.baia_id
  cross join public.configuracoes cfg
  where lp.destino = 'venda'
    and lp.status = 'Disponível'
    and lower(trim(b.especie)) = lower(trim(p_especie));
$$;
