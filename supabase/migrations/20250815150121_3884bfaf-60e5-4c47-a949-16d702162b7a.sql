-- Primeiro, vamos limpar as categorias existentes para reorganizar melhor
DELETE FROM categories;

-- ==========================================
-- CATEGORIAS PRINCIPAIS E SUBCATEGORIAS EXPANDIDAS
-- ==========================================

-- 1. VEÍCULOS E TRANSPORTES
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'veiculos', 'Veículos e Transportes', 1);

-- Subcategorias de Veículos
WITH veiculos_cat AS (SELECT id FROM categories WHERE slug = 'veiculos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'carros', 'Carros', (SELECT id FROM veiculos_cat), 1),
(gen_random_uuid(), 'motos', 'Motos e Scooters', (SELECT id FROM veiculos_cat), 2),
(gen_random_uuid(), 'caminhoes', 'Caminhões e Comerciais', (SELECT id FROM veiculos_cat), 3),
(gen_random_uuid(), 'barcos', 'Barcos e Náutica', (SELECT id FROM veiculos_cat), 4),
(gen_random_uuid(), 'bicicletas', 'Bicicletas', (SELECT id FROM veiculos_cat), 5),
(gen_random_uuid(), 'pecas-auto', 'Peças e Acessórios', (SELECT id FROM veiculos_cat), 6);

-- 2. IMÓVEIS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'imoveis', 'Imóveis', 2);

-- Subcategorias de Imóveis
WITH imoveis_cat AS (SELECT id FROM categories WHERE slug = 'imoveis')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'apartamentos-venda', 'Apartamentos à Venda', (SELECT id FROM imoveis_cat), 1),
(gen_random_uuid(), 'casas-venda', 'Casas à Venda', (SELECT id FROM imoveis_cat), 2),
(gen_random_uuid(), 'apartamentos-aluguel', 'Apartamentos para Alugar', (SELECT id FROM imoveis_cat), 3),
(gen_random_uuid(), 'casas-aluguel', 'Casas para Alugar', (SELECT id FROM imoveis_cat), 4),
(gen_random_uuid(), 'terrenos', 'Terrenos e Lotes', (SELECT id FROM imoveis_cat), 5),
(gen_random_uuid(), 'comerciais', 'Imóveis Comerciais', (SELECT id FROM imoveis_cat), 6),
(gen_random_uuid(), 'temporada', 'Temporada e Férias', (SELECT id FROM imoveis_cat), 7);

-- 3. EMPREGOS E OPORTUNIDADES
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'empregos', 'Empregos e Carreiras', 3);

-- Subcategorias de Empregos
WITH empregos_cat AS (SELECT id FROM categories WHERE slug = 'empregos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'tempo-integral', 'Tempo Integral', (SELECT id FROM empregos_cat), 1),
(gen_random_uuid(), 'meio-periodo', 'Meio Período', (SELECT id FROM empregos_cat), 2),
(gen_random_uuid(), 'freelancer', 'Freelancer', (SELECT id FROM empregos_cat), 3),
(gen_random_uuid(), 'estagio', 'Estágio', (SELECT id FROM empregos_cat), 4),
(gen_random_uuid(), 'temporario', 'Trabalho Temporário', (SELECT id FROM empregos_cat), 5),
(gen_random_uuid(), 'vendas', 'Vendas e Comércio', (SELECT id FROM empregos_cat), 6),
(gen_random_uuid(), 'tecnologia', 'Tecnologia e TI', (SELECT id FROM empregos_cat), 7),
(gen_random_uuid(), 'saude', 'Saúde e Medicina', (SELECT id FROM empregos_cat), 8),
(gen_random_uuid(), 'educacao', 'Educação e Ensino', (SELECT id FROM empregos_cat), 9),
(gen_random_uuid(), 'administracao', 'Administração e Finanças', (SELECT id FROM empregos_cat), 10);

-- 4. ELETRÔNICOS E TECNOLOGIA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'eletronicos', 'Eletrônicos e Tecnologia', 4);

-- Subcategorias de Eletrônicos
WITH eletronicos_cat AS (SELECT id FROM categories WHERE slug = 'eletronicos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'celulares', 'Celulares e Smartphones', (SELECT id FROM eletronicos_cat), 1),
(gen_random_uuid(), 'computadores', 'Computadores e Notebooks', (SELECT id FROM eletronicos_cat), 2),
(gen_random_uuid(), 'tablets', 'Tablets', (SELECT id FROM eletronicos_cat), 3),
(gen_random_uuid(), 'tvs', 'TVs e Home Theater', (SELECT id FROM eletronicos_cat), 4),
(gen_random_uuid(), 'games', 'Games e Consoles', (SELECT id FROM eletronicos_cat), 5),
(gen_random_uuid(), 'cameras', 'Câmeras e Filmadoras', (SELECT id FROM eletronicos_cat), 6),
(gen_random_uuid(), 'audio', 'Áudio e Som', (SELECT id FROM eletronicos_cat), 7),
(gen_random_uuid(), 'acessorios-tech', 'Acessórios de Tecnologia', (SELECT id FROM eletronicos_cat), 8);

-- 5. CASA E DECORAÇÃO
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'casa-decoracao', 'Casa e Decoração', 5);

-- Subcategorias de Casa e Decoração
WITH casa_cat AS (SELECT id FROM categories WHERE slug = 'casa-decoracao')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'moveis', 'Móveis', (SELECT id FROM casa_cat), 1),
(gen_random_uuid(), 'decoracao', 'Decoração', (SELECT id FROM casa_cat), 2),
(gen_random_uuid(), 'eletrodomesticos', 'Eletrodomésticos', (SELECT id FROM casa_cat), 3),
(gen_random_uuid(), 'cozinha', 'Cozinha e Utensílios', (SELECT id FROM casa_cat), 4),
(gen_random_uuid(), 'jardim', 'Jardim e Plantas', (SELECT id FROM casa_cat), 5),
(gen_random_uuid(), 'ferramentas', 'Ferramentas e Construção', (SELECT id FROM casa_cat), 6),
(gen_random_uuid(), 'limpeza', 'Limpeza e Organização', (SELECT id FROM casa_cat), 7);

-- 6. MODA E BELEZA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'moda-beleza', 'Moda e Beleza', 6);

-- Subcategorias de Moda e Beleza
WITH moda_cat AS (SELECT id FROM categories WHERE slug = 'moda-beleza')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'roupas-femininas', 'Roupas Femininas', (SELECT id FROM moda_cat), 1),
(gen_random_uuid(), 'roupas-masculinas', 'Roupas Masculinas', (SELECT id FROM moda_cat), 2),
(gen_random_uuid(), 'roupas-infantis', 'Roupas Infantis', (SELECT id FROM moda_cat), 3),
(gen_random_uuid(), 'calcados', 'Calçados', (SELECT id FROM moda_cat), 4),
(gen_random_uuid(), 'bolsas-acessorios', 'Bolsas e Acessórios', (SELECT id FROM moda_cat), 5),
(gen_random_uuid(), 'joias-relogios', 'Joias e Relógios', (SELECT id FROM moda_cat), 6),
(gen_random_uuid(), 'beleza-cosmeticos', 'Beleza e Cosméticos', (SELECT id FROM moda_cat), 7);

-- 7. ESPORTES E LAZER
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'esportes-lazer', 'Esportes e Lazer', 7);

-- Subcategorias de Esportes e Lazer
WITH esportes_cat AS (SELECT id FROM categories WHERE slug = 'esportes-lazer')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'equipamentos-esporte', 'Equipamentos Esportivos', (SELECT id FROM esportes_cat), 1),
(gen_random_uuid(), 'academia-fitness', 'Academia e Fitness', (SELECT id FROM esportes_cat), 2),
(gen_random_uuid(), 'camping-aventura', 'Camping e Aventura', (SELECT id FROM esportes_cat), 3),
(gen_random_uuid(), 'pesca', 'Pesca', (SELECT id FROM esportes_cat), 4),
(gen_random_uuid(), 'brinquedos', 'Brinquedos e Jogos', (SELECT id FROM esportes_cat), 5),
(gen_random_uuid(), 'instrumentos-musicais', 'Instrumentos Musicais', (SELECT id FROM esportes_cat), 6);

-- 8. SERVIÇOS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'servicos', 'Serviços', 8);

-- Subcategorias de Serviços
WITH servicos_cat AS (SELECT id FROM categories WHERE slug = 'servicos')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'reformas-construcao', 'Reformas e Construção', (SELECT id FROM servicos_cat), 1),
(gen_random_uuid(), 'limpeza-domestica', 'Limpeza Doméstica', (SELECT id FROM servicos_cat), 2),
(gen_random_uuid(), 'cuidados-pessoais', 'Cuidados Pessoais', (SELECT id FROM servicos_cat), 3),
(gen_random_uuid(), 'eventos-festas', 'Eventos e Festas', (SELECT id FROM servicos_cat), 4),
(gen_random_uuid(), 'transporte-mudanca', 'Transporte e Mudança', (SELECT id FROM servicos_cat), 5),
(gen_random_uuid(), 'manutencao-reparo', 'Manutenção e Reparo', (SELECT id FROM servicos_cat), 6),
(gen_random_uuid(), 'consultoria', 'Consultoria e Assessoria', (SELECT id FROM servicos_cat), 7),
(gen_random_uuid(), 'saude-bem-estar', 'Saúde e Bem-estar', (SELECT id FROM servicos_cat), 8),
(gen_random_uuid(), 'pet-services', 'Serviços para Pets', (SELECT id FROM servicos_cat), 9);

-- 9. ANIMAIS E PETS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'animais-pets', 'Animais e Pets', 9);

-- Subcategorias de Animais e Pets
WITH pets_cat AS (SELECT id FROM categories WHERE slug = 'animais-pets')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'caes', 'Cães', (SELECT id FROM pets_cat), 1),
(gen_random_uuid(), 'gatos', 'Gatos', (SELECT id FROM pets_cat), 2),
(gen_random_uuid(), 'aves', 'Aves', (SELECT id FROM pets_cat), 3),
(gen_random_uuid(), 'peixes-aquarios', 'Peixes e Aquários', (SELECT id FROM pets_cat), 4),
(gen_random_uuid(), 'outros-animais', 'Outros Animais', (SELECT id FROM pets_cat), 5),
(gen_random_uuid(), 'acessorios-pets', 'Acessórios para Pets', (SELECT id FROM pets_cat), 6),
(gen_random_uuid(), 'racao-alimentacao', 'Ração e Alimentação', (SELECT id FROM pets_cat), 7);

-- 10. LIVROS E EDUCAÇÃO
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'livros-educacao', 'Livros e Educação', 10);

-- Subcategorias de Livros e Educação
WITH livros_cat AS (SELECT id FROM categories WHERE slug = 'livros-educacao')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'livros-literatura', 'Livros e Literatura', (SELECT id FROM livros_cat), 1),
(gen_random_uuid(), 'cursos-online', 'Cursos Online', (SELECT id FROM livros_cat), 2),
(gen_random_uuid(), 'aulas-particulares', 'Aulas Particulares', (SELECT id FROM livros_cat), 3),
(gen_random_uuid(), 'material-escolar', 'Material Escolar', (SELECT id FROM livros_cat), 4),
(gen_random_uuid(), 'concursos', 'Concursos e Vestibular', (SELECT id FROM livros_cat), 5);

-- 11. NEGÓCIOS E INDÚSTRIA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'negocios-industria', 'Negócios e Indústria', 11);

-- Subcategorias de Negócios e Indústria
WITH negocios_cat AS (SELECT id FROM categories WHERE slug = 'negocios-industria')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'equipamentos-industriais', 'Equipamentos Industriais', (SELECT id FROM negocios_cat), 1),
(gen_random_uuid(), 'maquinas-agricolas', 'Máquinas Agrícolas', (SELECT id FROM negocios_cat), 2),
(gen_random_uuid(), 'equipamentos-escritorio', 'Equipamentos de Escritório', (SELECT id FROM negocios_cat), 3),
(gen_random_uuid(), 'franquias', 'Franquias e Oportunidades', (SELECT id FROM negocios_cat), 4),
(gen_random_uuid(), 'materiais-construcao', 'Materiais de Construção', (SELECT id FROM negocios_cat), 5);

-- 12. AGRONEGÓCIO E FAZENDA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'agronegocio', 'Agronegócio e Fazenda', 12);

-- Subcategorias de Agronegócio
WITH agro_cat AS (SELECT id FROM categories WHERE slug = 'agronegocio')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'gado-bovino', 'Gado Bovino', (SELECT id FROM agro_cat), 1),
(gen_random_uuid(), 'cavalos', 'Cavalos', (SELECT id FROM agro_cat), 2),
(gen_random_uuid(), 'aves-criacao', 'Aves de Criação', (SELECT id FROM agro_cat), 3),
(gen_random_uuid(), 'sementes-mudas', 'Sementes e Mudas', (SELECT id FROM agro_cat), 4),
(gen_random_uuid(), 'tratores', 'Tratores e Implementos', (SELECT id FROM agro_cat), 5),
(gen_random_uuid(), 'propriedades-rurais', 'Propriedades Rurais', (SELECT id FROM agro_cat), 6);

-- 13. COLEÇÕES E ANTIGUIDADES
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'colecoes-antiguidades', 'Coleções e Antiguidades', 13);

-- Subcategorias de Coleções
WITH colecoes_cat AS (SELECT id FROM categories WHERE slug = 'colecoes-antiguidades')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'moedas-cedulas', 'Moedas e Cédulas', (SELECT id FROM colecoes_cat), 1),
(gen_random_uuid(), 'selos', 'Selos', (SELECT id FROM colecoes_cat), 2),
(gen_random_uuid(), 'arte-antiguidades', 'Arte e Antiguidades', (SELECT id FROM colecoes_cat), 3),
(gen_random_uuid(), 'objetos-vintage', 'Objetos Vintage', (SELECT id FROM colecoes_cat), 4);

-- 14. OUTROS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
(gen_random_uuid(), 'outros', 'Outros', 14);

-- Subcategorias de Outros
WITH outros_cat AS (SELECT id FROM categories WHERE slug = 'outros')
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
(gen_random_uuid(), 'diversos', 'Diversos', (SELECT id FROM outros_cat), 1),
(gen_random_uuid(), 'trocas', 'Trocas', (SELECT id FROM outros_cat), 2),
(gen_random_uuid(), 'doacoes', 'Doações', (SELECT id FROM outros_cat), 3);