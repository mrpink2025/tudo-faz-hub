-- Primeiro, vamos verificar quantos listings existem e qual categoria padrão usar
-- Vamos criar uma categoria temporária "outros" se não existir
INSERT INTO categories (id, slug, name_pt, position) 
VALUES (gen_random_uuid(), 'outros-temp', 'Outros (Temporário)', 999)
ON CONFLICT (slug) DO NOTHING;

-- Atualizar todos os listings para usar a categoria temporária
UPDATE listings 
SET category_id = (SELECT id FROM categories WHERE slug = 'outros-temp' LIMIT 1)
WHERE category_id IS NOT NULL;

-- Agora podemos limpar e recriar as categorias
DELETE FROM categories;

-- ==========================================
-- CATEGORIAS PRINCIPAIS E SUBCATEGORIAS EXPANDIDAS
-- ==========================================

-- 1. VEÍCULOS E TRANSPORTES
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'veiculos', 'Veículos e Transportes', 1);

-- Subcategorias de Veículos
WITH veiculos_cat AS (SELECT id FROM categories WHERE slug = 'veiculos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) 
SELECT 
  gen_random_uuid(), 
  subcategory.slug, 
  subcategory.name_pt, 
  (SELECT id FROM veiculos_cat), 
  subcategory.position
FROM (VALUES
  ('carros', 'Carros', 1),
  ('motos', 'Motos e Scooters', 2),
  ('caminhoes', 'Caminhões e Comerciais', 3),
  ('barcos', 'Barcos e Náutica', 4),
  ('bicicletas', 'Bicicletas', 5),
  ('pecas-auto', 'Peças e Acessórios', 6)
) AS subcategory(slug, name_pt, position);

-- 2. IMÓVEIS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'imoveis', 'Imóveis', 2);

-- Subcategorias de Imóveis
WITH imoveis_cat AS (SELECT id FROM categories WHERE slug = 'imoveis')
INSERT INTO categories (id, slug, name_pt, parent_id, position) 
SELECT 
  gen_random_uuid(), 
  subcategory.slug, 
  subcategory.name_pt, 
  (SELECT id FROM imoveis_cat), 
  subcategory.position
FROM (VALUES
  ('apartamentos-venda', 'Apartamentos à Venda', 1),
  ('casas-venda', 'Casas à Venda', 2),
  ('apartamentos-aluguel', 'Apartamentos para Alugar', 3),
  ('casas-aluguel', 'Casas para Alugar', 4),
  ('terrenos', 'Terrenos e Lotes', 5),
  ('comerciais', 'Imóveis Comerciais', 6),
  ('temporada', 'Temporada e Férias', 7)
) AS subcategory(slug, name_pt, position);

-- 3. EMPREGOS E CARREIRAS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'empregos', 'Empregos e Carreiras', 3);

-- Subcategorias de Empregos
WITH empregos_cat AS (SELECT id FROM categories WHERE slug = 'empregos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) 
SELECT 
  gen_random_uuid(), 
  subcategory.slug, 
  subcategory.name_pt, 
  (SELECT id FROM empregos_cat), 
  subcategory.position
FROM (VALUES
  ('tempo-integral', 'Tempo Integral', 1),
  ('meio-periodo', 'Meio Período', 2),
  ('freelancer', 'Freelancer', 3),
  ('estagio', 'Estágio', 4),
  ('temporario', 'Trabalho Temporário', 5),
  ('vendas', 'Vendas e Comércio', 6),
  ('tecnologia', 'Tecnologia e TI', 7),
  ('saude-emprego', 'Saúde e Medicina', 8),
  ('educacao-emprego', 'Educação e Ensino', 9),
  ('administracao', 'Administração e Finanças', 10)
) AS subcategory(slug, name_pt, position);

-- 4. ELETRÔNICOS E TECNOLOGIA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'eletronicos', 'Eletrônicos e Tecnologia', 4);

-- Subcategorias de Eletrônicos
WITH eletronicos_cat AS (SELECT id FROM categories WHERE slug = 'eletronicos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) 
SELECT 
  gen_random_uuid(), 
  subcategory.slug, 
  subcategory.name_pt, 
  (SELECT id FROM eletronicos_cat), 
  subcategory.position
FROM (VALUES
  ('celulares', 'Celulares e Smartphones', 1),
  ('computadores', 'Computadores e Notebooks', 2),
  ('tablets', 'Tablets', 3),
  ('tvs', 'TVs e Home Theater', 4),
  ('games', 'Games e Consoles', 5),
  ('cameras', 'Câmeras e Filmadoras', 6),
  ('audio', 'Áudio e Som', 7),
  ('acessorios-tech', 'Acessórios de Tecnologia', 8)
) AS subcategory(slug, name_pt, position);

-- 5. CASA E DECORAÇÃO
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'casa-decoracao', 'Casa e Decoração', 5);