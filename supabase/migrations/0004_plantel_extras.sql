-- Criatório Velho Oeste — plantel: anilha (identificação individual) e foto
-- customizada para aves e baias.
--
-- 1) aves.anilha — número da anilha física da ave, pra identificar cada
--    animal individualmente. Único quando preenchido (várias aves podem
--    ainda não ter anilha, ou seja, vários NULL — isso é permitido; o que
--    não pode é duas aves com o MESMO número de anilha preenchido).
-- 2) aves.foto_url / baias.foto_url — foto que substitui o emoji padrão nos
--    cards do admin, quando o usuário faz upload clicando no ícone. Reusa o
--    bucket "product-images" já existente (supabase/migrations/0002_storage.sql)
--    com um novo prefixo de caminho (aves/... e baias/...) — as políticas de
--    RLS desse bucket não restringem por caminho, então nenhuma policy nova
--    é necessária.

alter table public.aves
  add column if not exists anilha text,
  add column if not exists foto_url text;

alter table public.baias
  add column if not exists foto_url text;

-- Anilha única só entre as preenchidas (índice parcial: ignora NULL).
create unique index if not exists aves_anilha_unique_idx
  on public.aves (anilha) where anilha is not null;

comment on column public.aves.anilha is 'Número da anilha (identificação física) da ave, quando houver. Único entre as preenchidas.';
comment on column public.aves.foto_url is 'Foto da ave (ou da espécie), substitui o emoji padrão nos cards quando definida.';
comment on column public.baias.foto_url is 'Foto representando a baia/espécie, substitui o emoji padrão nos cards quando definida.';
