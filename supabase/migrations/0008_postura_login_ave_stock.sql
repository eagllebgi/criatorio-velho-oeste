-- Criatório Velho Oeste — login na coleta por QR, múltiplos destinos por
-- lançamento, estoque de ovos automático e estoque de aves derivado do Plantel
--
-- Quatro mudanças nesta migração:
--
--   1) Registrar postura com destino "Venda" já soma direto no estoque da
--      raça de Ovo correspondente (por nome da espécie, mesmo casamento de
--      texto usado em 0006 pra fotos) — sem precisar editar o estoque à mão
--      depois de cada coleta.
--
--   2) A tela de coleta por QR (/coletar/<token>) deixa de ser anônima: só
--      funciona logado (mesma conta do painel admin). Revoga o acesso do
--      papel "anon" nas duas funções de 0007 — só "authenticated" continua
--      podendo chamar.
--
--   3) coletar_registrar_postura passa a aceitar uma LISTA de itens
--      (destino + quantidade) numa chamada só, em vez de um destino/
--      quantidade fixos — pra dar "10 pra chocadeira, 20 pra venda" de uma
--      vez, igual ao formulário do painel (createPostura, em
--      baias/actions.ts, já atualizado do mesmo jeito).
--
--   4) Estoque de raças do tipo "Ave" deixa de ser digitado à mão: agora é
--      calculado sozinho, contando quantas aves daquela espécie estão com
--      status "Disponível" no Plantel (a espécie de uma ave é sempre a da
--      baia onde ela está — o campo "nome" da ave é só uma identificação
--      livre, não a raça). Cadastrar uma ave nova disponível pra venda no
--      Plantel (com a anilha dela) já reflete automaticamente no estoque do
--      produto — e dar baixa (vendida/separada/óbito) tira do estoque do
--      mesmo jeito. Estoque de Ovo continua editável à mão normalmente.

-- ---------------------------------------------------------------------------
-- 1) lotes_postura (destino = venda) -> products.stock (raça de Ovo)
-- ---------------------------------------------------------------------------
create or replace function public.sync_postura_venda_to_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_especie text;
begin
  if new.destino <> 'venda' then
    return new;
  end if;

  select b.especie into v_especie from public.baias b where b.id = new.baia_id;
  if v_especie is null then
    return new;
  end if;

  update public.products
  set stock = stock + new.quantidade
  where product_type = 'ovo'
    and lower(trim(name)) = lower(trim(v_especie));

  return new;
end;
$$;

drop trigger if exists trg_sync_postura_venda_to_product_stock on public.lotes_postura;
create trigger trg_sync_postura_venda_to_product_stock
  after insert on public.lotes_postura
  for each row
  execute function public.sync_postura_venda_to_product_stock();

-- ---------------------------------------------------------------------------
-- 2) Coleta por QR passa a exigir login — revoga o acesso anônimo das
--    funções criadas em 0007. Continuam SECURITY DEFINER (RLS de "baias" e
--    "lotes_postura" segue admin-only), só quem está autenticado consegue
--    chamar agora.
-- ---------------------------------------------------------------------------
revoke execute on function public.coletar_baia_info(uuid) from anon;

revoke execute on function public.coletar_registrar_postura(uuid, integer, text) from anon;

-- ---------------------------------------------------------------------------
-- 3) coletar_registrar_postura — nova versão com lista de itens (jsonb) em
--    vez de destino/quantidade únicos. Substitui a função de 0007 (mesmo
--    nome, assinatura diferente — por isso o drop explícito da versão
--    antiga antes de criar a nova).
-- ---------------------------------------------------------------------------
drop function if exists public.coletar_registrar_postura(uuid, integer, text);

create or replace function public.coletar_registrar_postura(
  p_qr_token uuid,
  p_itens jsonb
)
returns table (
  baia_nome text,
  codigos text[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_baia_id uuid;
  v_baia_nome text;
  v_preco_ovo numeric;
  v_next_number integer;
  v_codigo text;
  v_status text;
  v_eclosao date;
  v_item jsonb;
  v_destino text;
  v_quantidade integer;
  v_codigos text[] := array[]::text[];
begin
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe a quantidade de ovos.';
  end if;

  select b.id, b.nome, b.preco_ovo
    into v_baia_id, v_baia_nome, v_preco_ovo
  from public.baias b
  where b.qr_token = p_qr_token;

  if not found then
    raise exception 'QR Code inválido — baia não encontrada.';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_destino := v_item ->> 'destino';
    v_quantidade := (v_item ->> 'quantidade')::integer;

    if v_destino is null or v_destino not in ('venda', 'choc', 'reservado', 'descarte') then
      raise exception 'Destino inválido.';
    end if;
    if v_quantidade is null or v_quantidade <= 0 then
      raise exception 'Quantidade inválida.';
    end if;

    -- Mesmo esquema de código sequencial do painel (nextCodigo, em
    -- src/lib/actions/codigo.ts): roda dentro da mesma função/transação, o
    -- que mantém atômico mesmo lançando vários itens de uma vez.
    select coalesce(max(substring(l.codigo from 2)::integer), 0) + 1
      into v_next_number
    from public.lotes_postura l
    where l.codigo like 'L%';

    v_codigo := 'L' || lpad(v_next_number::text, 4, '0');

    v_eclosao := null;
    if v_destino = 'choc' then
      v_status := 'Incubando';
      v_eclosao := current_date + 21;
    elsif v_destino = 'reservado' then
      v_status := 'Reservado';
    elsif v_destino = 'descarte' then
      v_status := 'Descartado';
    else
      v_status := 'Disponível';
    end if;

    insert into public.lotes_postura (codigo, baia_id, quantidade, preco_unit, destino, status, eclosao_prevista)
    values (v_codigo, v_baia_id, v_quantidade, v_preco_ovo, v_destino, v_status, v_eclosao);

    v_codigos := v_codigos || v_codigo;
  end loop;

  return query select v_baia_nome, v_codigos;
end;
$$;

revoke all on function public.coletar_registrar_postura(uuid, jsonb) from public;
grant execute on function public.coletar_registrar_postura(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Estoque de raças "Ave" derivado do Plantel
-- ---------------------------------------------------------------------------

-- Recalcula (do zero, contando de novo) o estoque de TODAS as raças "Ave"
-- cujo nome bate com a espécie informada — mesmo casamento de texto (sem
-- espaço nas pontas, sem diferenciar maiúscula/minúscula) usado em 0006.
create or replace function public.recompute_ave_stock_for_especie(p_especie text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_especie is null or trim(p_especie) = '' then
    return;
  end if;

  select count(*) into v_count
  from public.aves a
  join public.baias b on b.id = a.baia_id
  where a.status = 'Disponível'
    and lower(trim(b.especie)) = lower(trim(p_especie));

  update public.products
  set stock = v_count
  where product_type = 'ave'
    and lower(trim(name)) = lower(trim(p_especie))
    and stock is distinct from v_count;
end;
$$;

-- Ave criada, com baixa (mudou de status), ou movida de baia (mudou de
-- espécie) — recalcula tanto a espécie nova quanto a antiga (quando muda).
create or replace function public.trg_sync_ave_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_especie text;
  v_new_especie text;
begin
  if tg_op = 'DELETE' then
    select especie into v_old_especie from public.baias where id = old.baia_id;
    perform public.recompute_ave_stock_for_especie(v_old_especie);
    return old;
  end if;

  if tg_op = 'UPDATE' then
    select especie into v_old_especie from public.baias where id = old.baia_id;
  end if;

  select especie into v_new_especie from public.baias where id = new.baia_id;

  perform public.recompute_ave_stock_for_especie(v_new_especie);
  if v_old_especie is not null and v_old_especie is distinct from v_new_especie then
    perform public.recompute_ave_stock_for_especie(v_old_especie);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_aves_sync_stock on public.aves;
create trigger trg_aves_sync_stock
  after insert or delete or update of status, baia_id on public.aves
  for each row
  execute function public.trg_sync_ave_stock();

-- Baia trocou de espécie -> o conjunto de aves contado em cada raça muda,
-- recalcula a espécie antiga e a nova.
create or replace function public.trg_sync_baia_especie_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old.especie is distinct from new.especie then
    perform public.recompute_ave_stock_for_especie(old.especie);
  end if;
  perform public.recompute_ave_stock_for_especie(new.especie);
  return new;
end;
$$;

drop trigger if exists trg_baias_sync_ave_stock on public.baias;
create trigger trg_baias_sync_ave_stock
  after update of especie on public.baias
  for each row
  execute function public.trg_sync_baia_especie_stock();

-- Raça "Ave" criada ou renomeada -> já nasce com o estoque certo, contando o
-- que já existe hoje no Plantel pra essa espécie.
create or replace function public.trg_sync_product_ave_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.product_type = 'ave' then
    perform public.recompute_ave_stock_for_especie(new.name);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_sync_ave_stock on public.products;
create trigger trg_products_sync_ave_stock
  after insert or update of name, product_type on public.products
  for each row
  execute function public.trg_sync_product_ave_stock();

-- Backfill único: acerta o estoque de todas as raças "Ave" já cadastradas
-- hoje, pra elas nascerem corretas assim que essa migração roda (sem
-- precisar editar/salvar cada uma manualmente pra disparar o cálculo).
do $$
declare
  v_product record;
begin
  for v_product in select distinct name from public.products where product_type = 'ave'
  loop
    perform public.recompute_ave_stock_for_especie(v_product.name);
  end loop;
end $$;
