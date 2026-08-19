-- Seed inicial — Criatório Velho Oeste
-- Cadastra as categorias e as 24 raças informadas, todas SEM preço e SEM
-- estoque definidos (price = null, stock = 0, active = false), aguardando
-- configuração posterior pelo painel /admin (Estoque / Preços / Produtos).
-- Seguro para rodar mais de uma vez: usa "on conflict (slug) do nothing".

-- ---------------------------------------------------------------------------
-- categorias
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, display_order, active) values
  ('Galinhas', 'galinhas', 10, true),
  ('Galinhas Ornamentais', 'galinhas-ornamentais', 20, true),
  ('Angolas', 'angolas', 30, true),
  ('Faisões', 'faisoes', 40, true),
  ('Marrecos', 'marrecos', 50, true),
  ('Pavões', 'pavoes', 60, true),
  ('Outras Aves', 'outras-aves', 70, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- produtos (raças)
-- ---------------------------------------------------------------------------
insert into public.products
  (name, slug, category_id, short_description, price, stock, low_stock_threshold, active, featured, display_order)
select v.name, v.slug,
       (select id from public.categories where slug = v.category_slug),
       v.short_description, null, 0, 5, false, false, v.display_order
from (
  values
    ('Angola Lavanda',             'angola-lavanda',              'angolas',              'Ovos férteis', 10),
    ('Angola Preta',               'angola-preta',                'angolas',              'Ovos férteis', 20),
    ('Angola Canela',              'angola-canela',                'angolas',              'Ovos férteis', 30),
    ('Angola Branca',              'angola-branca',                'angolas',              'Ovos férteis', 40),
    ('Faisão Coleira',             'faisao-coleira',               'faisoes',              'Ovos férteis', 50),
    ('Faisão Versicolor',          'faisao-versicolor',            'faisoes',              'Ovos férteis', 60),
    ('Faisão Prateado',            'faisao-prateado',              'faisoes',              'Ovos férteis', 70),
    ('GSB',                        'gsb',                          'galinhas-ornamentais', 'Ovos férteis', 80),
    ('Serama',                     'serama',                       'galinhas-ornamentais', 'Ovos férteis', 90),
    ('Belgiam',                    'belgiam',                      'galinhas-ornamentais', 'Ovos férteis', 100),
    ('Rodia Gigante',              'rodia-gigante',                'galinhas',             'Ovos férteis', 110),
    ('Mini Cochim Lavanda',        'mini-cochim-lavanda',          'galinhas-ornamentais', 'Ovos férteis', 120),
    ('Mini Cochim Preto',          'mini-cochim-preto',            'galinhas-ornamentais', 'Ovos férteis', 130),
    ('Polonesa',                   'polonesa',                     'galinhas-ornamentais', 'Ovos férteis', 140),
    ('Cara de Palhaço',            'cara-de-palhaco',               'galinhas-ornamentais', 'Ovos férteis', 150),
    ('Sedosa',                     'sedosa',                       'galinhas-ornamentais', 'Ovos férteis', 160),
    ('Brahma White',               'brahma-white',                 'galinhas',             'Ovos férteis', 170),
    ('Brahma Lemon Pyle',          'brahma-lemon-pyle',            'galinhas',             'Ovos férteis', 180),
    ('Brahma Splash',              'brahma-splash',                'galinhas',             'Ovos férteis', 190),
    ('Ayam Cemani',                'ayam-cemani',                  'galinhas-ornamentais', 'Ovos férteis', 200),
    ('Marreco Pompom Branco',      'marreco-pompom-branco',        'marrecos',             'Ovos férteis', 210),
    ('Marreco Pompom Colorido',    'marreco-pompom-colorido',      'marrecos',             'Ovos férteis', 220),
    ('Pavão Azul Indiano',         'pavao-azul-indiano',           'pavoes',               'Ovos férteis', 230),
    ('Pavão Branco',               'pavao-branco',                 'pavoes',               'Ovos férteis', 240)
) as v(name, slug, category_slug, short_description, display_order)
on conflict (slug) do nothing;
