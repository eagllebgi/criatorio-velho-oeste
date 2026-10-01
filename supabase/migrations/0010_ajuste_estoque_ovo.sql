-- Corrige o estoque de Ovo ficar só aumentando (nunca diminuindo) conforme o
-- lote de postura muda de vida: enviar pra chocadeira, vender rápido,
-- descartar ou excluir. Até aqui só existia o gatilho de INSERT em
-- lotes_postura (0008_postura_login_ave_stock.sql), que soma ao estoque
-- quando um lote nasce com destino "venda" — mas nunca subtraía quando esse
-- mesmo lote saía do "Disponível" por qualquer motivo.
--
-- Essa função é chamada diretamente pelas actions de src/app/(admin)/admin/
-- (protected)/postura/actions.ts (não é gatilho — cada action sabe exatamente
-- quanto ajustar e quando). Usa o mesmo padrão de comparação por nome usado
-- em 0006/0008/0009: lower(trim(a)) = lower(trim(b)).
create or replace function public.adjust_ovo_stock(p_especie text, p_delta integer)
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.products
  set stock = greatest(0, stock + p_delta)
  where product_type = 'ovo'
    and lower(trim(name)) = lower(trim(p_especie));
$$;

-- Só precisa ser chamada pelo painel admin (autenticado) — as actions de
-- postura.ts já rodam com o usuário logado, diferente do
-- ovo_freshness_buckets (0009), que precisa ser lido pelo carrinho público
-- (anon) e por isso é security definer.
grant execute on function public.adjust_ovo_stock(text, integer) to authenticated;
