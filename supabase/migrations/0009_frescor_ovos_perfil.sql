-- Criatório Velho Oeste — regra de frescor pra envio de ovos + confirmação
-- automática no carrinho
--
-- Regra combinada com o Gabriel:
--   - Ovo coletado há até 5 dias: pode ser enviado pra qualquer estado do
--     Brasil.
--   - Ovo coletado há 6 ou 7 dias: só dá pra garantir o envio dentro de São
--     Paulo (SP).
--   - Depois de 7 dias, o lote não entra mais nessa conta (não é mais
--     considerado "fresco o bastante" pra envio) — segue existindo no
--     estoque/painel normalmente, só não conta mais aqui.
--
-- Essa migração cria só UMA função nova, `ovo_freshness_buckets`: dado o
-- nome de uma raça de Ovo, soma quanto tem disponível pra venda em cada uma
-- das duas janelas acima (0-5 dias e 6-7 dias), olhando pra `lotes_postura`.
-- É SECURITY DEFINER e liberada pra "anon" porque o carrinho do site
-- público roda sem ninguém logado (mesmo padrão das funções de
-- 0007_qr_postura.sql) — só devolve uma soma, nunca expõe os lotes/baias
-- direto.
--
-- Tudo o mais dessa parte do pedido do Gabriel (colunas informativas em
-- Produtos/Ovos, aviso no Dashboard de lote chegando no prazo, tela de
-- Perfil/Admin) é calculado na hora a partir das tabelas que já existem —
-- não precisou de nenhuma tabela ou coluna nova, então não tem mais nada
-- pra migrar além dessa função.

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
      sum(case when (current_date - lp.data_postura) <= 5 then lp.quantidade else 0 end),
      0
    )::integer as qtd_ate_5,
    coalesce(
      sum(case when (current_date - lp.data_postura) between 6 and 7 then lp.quantidade else 0 end),
      0
    )::integer as qtd_ate_7
  from public.lotes_postura lp
  join public.baias b on b.id = lp.baia_id
  where lp.destino = 'venda'
    and lp.status = 'Disponível'
    and lower(trim(b.especie)) = lower(trim(p_especie));
$$;

grant execute on function public.ovo_freshness_buckets(text) to anon, authenticated;
