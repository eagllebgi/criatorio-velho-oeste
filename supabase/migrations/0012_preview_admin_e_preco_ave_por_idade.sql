-- Criatório Velho Oeste — "Ver como visitante" + preço de Ave por idade
--
-- 1) Nenhuma tabela/coluna nova pro "Ver como visitante": é só um cookie
--    (fora do banco) que faz as páginas públicas tratarem o admin logado como
--    um visitante comum na hora de renderizar — não mexe em RLS nem em dado
--    nenhum. Esse bloco de comentário existe só pra registrar isso no
--    histórico de migrations; não tem SQL pra rodar aqui.
--
-- 2) products: 4 novos preços opcionais, usados só quando product_type =
--    'ave', pra vender a mesma raça por um valor diferente conforme a idade
--    da ave (1-30 dias, 31-60, 61-90, 91-120). O preço único que já existia
--    (products.price) continua existindo e funcionando exatamente como antes
--    — é o preço mostrado na lista geral (/aves) e usado no pedido pelo
--    WhatsApp; os 4 novos só aparecem como uma tabela informativa na página
--    da própria ave, pra o cliente já ver a faixa de preço por idade antes de
--    chamar no WhatsApp. Pra Ovo, esses 4 campos ficam sempre em branco.
alter table public.products
  add column if not exists price_1_30 numeric(10, 2)
    check (price_1_30 is null or price_1_30 >= 0),
  add column if not exists price_31_60 numeric(10, 2)
    check (price_31_60 is null or price_31_60 >= 0),
  add column if not exists price_61_90 numeric(10, 2)
    check (price_61_90 is null or price_61_90 >= 0),
  add column if not exists price_91_120 numeric(10, 2)
    check (price_91_120 is null or price_91_120 >= 0);

comment on column public.products.price_1_30 is
  'Preço de venda da Ave com 1 a 30 dias de vida. Só usado quando product_type = ave; informativo, mostrado na página da ave.';
comment on column public.products.price_31_60 is
  'Preço de venda da Ave com 31 a 60 dias de vida.';
comment on column public.products.price_61_90 is
  'Preço de venda da Ave com 61 a 90 dias de vida.';
comment on column public.products.price_91_120 is
  'Preço de venda da Ave com 91 a 120 dias de vida.';
