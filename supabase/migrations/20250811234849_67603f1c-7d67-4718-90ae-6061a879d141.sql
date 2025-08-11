-- Seed demo listings for every category (idempotent)
-- Each category gets 1 demo listing titled "DEMO - <Categoria>"
-- Highlight only root categories to populate the top featured bar

INSERT INTO public.listings (
  id,
  user_id,
  category_id,
  title,
  description,
  price,
  currency,
  location,
  status,
  approved,
  highlighted,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() AS id,
  '00000000-0000-0000-0000-000000000001'::uuid AS user_id,
  c.id AS category_id,
  'DEMO - ' || c.name_pt AS title,
  'Anúncio de demonstração para a categoria ' || c.name_pt AS description,
  (1000 + floor(random()*90000))::int AS price,
  'BRL'::text AS currency,
  'São Paulo, SP'::text AS location,
  'published'::text AS status,
  true AS approved,
  CASE WHEN c.parent_id IS NULL THEN true ELSE false END AS highlighted,
  now() - (random() * interval '30 days') AS created_at,
  now() AS updated_at
FROM public.categories c
WHERE NOT EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.category_id = c.id AND l.title = 'DEMO - ' || c.name_pt
);
