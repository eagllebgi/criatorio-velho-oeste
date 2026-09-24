-- Criatório Velho Oeste — cascata automática de fotos entre raça, baia e ave
--
-- Ideia: a foto só precisa ser adicionada UMA vez, no lugar mais conveniente,
-- e se propaga sozinha pros lugares correspondentes:
--
--   1) Produto (raça, em /admin/produtos) -> Baia com a mesma espécie
--      Quando a foto principal de um produto é definida (ou o produto é
--      renomeado), se já existir uma baia com "especie" igual ao nome da
--      raça (comparando sem espaços nas pontas e sem diferenciar
--      maiúscula/minúscula), a foto da baia é atualizada junto.
--
--   2) Baia -> todas as aves vinculadas a ela (plantel)
--      Quando a foto de uma baia é definida/trocada, TODAS as aves daquela
--      baia recebem a mesma foto — mesmo as que já tinham uma foto própria
--      diferente (a foto da baia sempre vence).
--
--   3) Nova ave criada numa baia que já tem foto
--      Ao cadastrar uma ave nova sem foto, se a baia escolhida já tiver
--      foto, a ave já nasce com essa foto (sem precisar enviar de novo).
--
-- Importante: a cascata é sempre "de cima pra baixo" (produto -> baia -> ave).
-- Editar a foto direto numa ave não altera a baia, e editar a foto de uma
-- baia não altera o produto/raça — cada nível só empurra pra baixo, nunca
-- pra cima.
--
-- Limitação conhecida: a ligação entre raça e baia é só por texto (nome da
-- raça = campo "Espécie" da baia). Se estiver escrito diferente (acento,
-- maiúscula/minúscula, espaço a mais), não vai casar — vale a pena manter o
-- nome da espécie na baia igual ao nome da raça cadastrada em Produtos.

-- ---------------------------------------------------------------------------
-- 1) products.main_image -> baias.foto_url (por nome da espécie)
-- ---------------------------------------------------------------------------
create or replace function public.sync_product_photo_to_baia()
returns trigger
language plpgsql
as $$
begin
  if new.main_image is null then
    return new;
  end if;

  update public.baias
  set foto_url = new.main_image
  where lower(trim(especie)) = lower(trim(new.name))
    and foto_url is distinct from new.main_image;

  return new;
end;
$$;

drop trigger if exists trg_sync_product_photo_to_baia on public.products;
create trigger trg_sync_product_photo_to_baia
  after insert or update of main_image, name on public.products
  for each row
  execute function public.sync_product_photo_to_baia();

-- ---------------------------------------------------------------------------
-- 2) baias.foto_url -> aves.foto_url (todas as aves daquela baia)
-- ---------------------------------------------------------------------------
create or replace function public.sync_baia_photo_to_aves()
returns trigger
language plpgsql
as $$
begin
  if new.foto_url is null then
    return new;
  end if;

  update public.aves
  set foto_url = new.foto_url
  where baia_id = new.id
    and foto_url is distinct from new.foto_url;

  return new;
end;
$$;

drop trigger if exists trg_sync_baia_photo_to_aves on public.baias;
create trigger trg_sync_baia_photo_to_aves
  after insert or update of foto_url on public.baias
  for each row
  execute function public.sync_baia_photo_to_aves();

-- ---------------------------------------------------------------------------
-- 3) Nova ave sem foto herda a foto da baia escolhida, se houver
-- ---------------------------------------------------------------------------
create or replace function public.default_ave_photo_from_baia()
returns trigger
language plpgsql
as $$
begin
  if new.foto_url is null and new.baia_id is not null then
    select foto_url into new.foto_url from public.baias where id = new.baia_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_default_ave_photo_from_baia on public.aves;
create trigger trg_default_ave_photo_from_baia
  before insert on public.aves
  for each row
  execute function public.default_ave_photo_from_baia();
