-- Criatório Velho Oeste — ajustes em produtos e financeiro
--
-- 1) products: o slug deixa de ser único no catálogo inteiro e passa a ser
--    único só DENTRO de cada tipo (ovo/ave). Isso permite cadastrar a mesma
--    raça duas vezes — uma como "Ovo fértil" e outra como "Ave viva" — com o
--    mesmo nome, sem colidir (antes o segundo cadastro falhava com "já existe
--    uma raça com esse nome", mesmo sendo tipos diferentes).
-- 2) financeiro: novo campo opcional "forma_pagamento" (pix/dinheiro/cartão),
--    pra registrar como cada lançamento foi recebido/pago.

-- ---------------------------------------------------------------------------
-- products.slug — único por tipo, não mais globalmente
-- ---------------------------------------------------------------------------
alter table public.products drop constraint if exists products_slug_key;

alter table public.products
  add constraint products_slug_product_type_key unique (slug, product_type);

comment on constraint products_slug_product_type_key on public.products is
  'Slug único dentro de cada tipo (ovo/ave) — permite a mesma raça existir como Ovo e como Ave com o mesmo nome/slug.';

-- ---------------------------------------------------------------------------
-- financeiro.forma_pagamento
-- ---------------------------------------------------------------------------
alter table public.financeiro
  add column if not exists forma_pagamento text
  check (forma_pagamento is null or forma_pagamento in ('pix', 'dinheiro', 'cartao'));

comment on column public.financeiro.forma_pagamento is 'Como o lançamento foi recebido/pago: pix, dinheiro ou cartão de crédito. Opcional (lançamentos antigos não têm essa informação).';
