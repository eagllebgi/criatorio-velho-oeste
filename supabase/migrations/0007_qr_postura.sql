-- Criatório Velho Oeste — coleta de ovos por QR Code
--
-- Cada baia ganha um "qr_token" (um código aleatório, impossível de
-- adivinhar) usado para montar um link único tipo:
--
--   https://seusite.com.br/coletar/<qr_token>
--
-- Esse link vira um QR Code impresso e colado na frente da baia. Quando o
-- camponês escaneia, cai numa tela simples (sem precisar de login) que já
-- mostra o nome/espécie da baia pra ele confirmar, e registra a postura de
-- ovos com um toque.
--
-- Segurança: "baias" e "lotes_postura" continuam com RLS admin-only (só
-- quem está logado no painel pode ler/escrever direto nessas tabelas — veja
-- 0003_gestao.sql). O acesso anônimo (sem login, pelo QR) passa SÓ pelas
-- duas funções abaixo, que são bem restritas: uma só lê nome/espécie/destino
-- da baia dona do token, e a outra só sabe fazer uma coisa — inserir UM lote
-- de postura pra aquela baia. Nenhuma delas permite ver ou mexer em mais
-- nada (financeiro, outras baias, plantel, etc.).

-- ---------------------------------------------------------------------------
-- 1) baias.qr_token — um código único por baia, gerado sozinho
-- ---------------------------------------------------------------------------
-- Como o valor padrão (gen_random_uuid()) é diferente a cada linha, o
-- Postgres já preenche automaticamente um token novo pra cada baia que já
-- existe hoje, sem precisar de nenhum passo manual — e toda baia nova
-- cadastrada daqui pra frente também já nasce com o dela.
alter table public.baias
  add column if not exists qr_token uuid not null default gen_random_uuid();

create unique index if not exists baias_qr_token_key on public.baias (qr_token);

comment on column public.baias.qr_token is 'Código único usado no link/QR Code de coleta de ovos (/coletar/<token>) — não é o id da baia de propósito, pra não expor os ids reais publicamente.';

-- ---------------------------------------------------------------------------
-- 2) coletar_baia_info — leitura pública (anônima) só do necessário pra
--    tela de confirmação: nome, espécie, destino padrão e preço do ovo.
-- ---------------------------------------------------------------------------
create or replace function public.coletar_baia_info(p_qr_token uuid)
returns table (
  nome text,
  especie text,
  destino_padrao text,
  preco_ovo numeric
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select b.nome, b.especie, b.destino_padrao, b.preco_ovo
  from public.baias b
  where b.qr_token = p_qr_token;
$$;

revoke all on function public.coletar_baia_info(uuid) from public;
grant execute on function public.coletar_baia_info(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) coletar_registrar_postura — escrita pública (anônima), mas bem
--    restrita: só sabe inserir um lote de postura pra baia dona do token
--    informado, replicando exatamente a mesma regra que o painel usa
--    (createPostura, em baias/actions.ts): destino define o status inicial
--    e, no caso de "chocadeira", calcula a previsão de eclosão em 21 dias.
--    Preço do ovo é sempre o preço padrão cadastrado na baia (não dá pra
--    digitar um preço diferente por essa tela, de propósito).
-- ---------------------------------------------------------------------------
create or replace function public.coletar_registrar_postura(
  p_qr_token uuid,
  p_quantidade integer,
  p_destino text
)
returns table (
  codigo text,
  baia_nome text
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
begin
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'Quantidade inválida.';
  end if;

  if p_destino is null or p_destino not in ('venda', 'choc', 'reservado', 'descarte') then
    raise exception 'Destino inválido.';
  end if;

  select b.id, b.nome, b.preco_ovo
    into v_baia_id, v_baia_nome, v_preco_ovo
  from public.baias b
  where b.qr_token = p_qr_token;

  if not found then
    raise exception 'QR Code inválido — baia não encontrada.';
  end if;

  -- Mesmo esquema de código sequencial do painel (nextCodigo, em
  -- src/lib/actions/codigo.ts): próximo número depois do maior "L####" já
  -- usado. Por rodar tudo dentro desta função (select + insert), fica
  -- atômico — não tem risco de dois escaneamentos ao mesmo tempo gerarem o
  -- mesmo código (o que a versão em TypeScript, usada só pelo painel com um
  -- clique de cada vez, não precisa se preocupar).
  select coalesce(max(substring(l.codigo from 2)::integer), 0) + 1
    into v_next_number
  from public.lotes_postura l
  where l.codigo like 'L%';

  v_codigo := 'L' || lpad(v_next_number::text, 4, '0');

  if p_destino = 'choc' then
    v_status := 'Incubando';
    v_eclosao := current_date + 21;
  elsif p_destino = 'reservado' then
    v_status := 'Reservado';
  elsif p_destino = 'descarte' then
    v_status := 'Descartado';
  else
    v_status := 'Disponível';
  end if;

  insert into public.lotes_postura (codigo, baia_id, quantidade, preco_unit, destino, status, eclosao_prevista)
  values (v_codigo, v_baia_id, p_quantidade, v_preco_ovo, p_destino, v_status, v_eclosao);

  return query select v_codigo, v_baia_nome;
end;
$$;

revoke all on function public.coletar_registrar_postura(uuid, integer, text) from public;
grant execute on function public.coletar_registrar_postura(uuid, integer, text) to anon, authenticated;
