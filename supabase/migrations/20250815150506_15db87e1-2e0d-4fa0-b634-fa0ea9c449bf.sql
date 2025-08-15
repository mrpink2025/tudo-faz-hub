-- Excluir todos os anúncios e imagens existentes
DELETE FROM listing_images;
DELETE FROM listings;

-- Excluir todas as categorias
DELETE FROM categories;

-- ==========================================
-- CATEGORIAS PRINCIPAIS E SUBCATEGORIAS EXPANDIDAS
-- ==========================================

-- 1. VEÍCULOS E TRANSPORTES
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('11111111-1111-1111-1111-111111111111', 'veiculos', 'Veículos e Transportes', 1);

-- Subcategorias de Veículos
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('11111111-1111-1111-1111-111111111112', 'carros', 'Carros', '11111111-1111-1111-1111-111111111111', 1),
('11111111-1111-1111-1111-111111111113', 'motos', 'Motos e Scooters', '11111111-1111-1111-1111-111111111111', 2),
('11111111-1111-1111-1111-111111111114', 'caminhoes', 'Caminhões e Comerciais', '11111111-1111-1111-1111-111111111111', 3),
('11111111-1111-1111-1111-111111111115', 'barcos', 'Barcos e Náutica', '11111111-1111-1111-1111-111111111111', 4),
('11111111-1111-1111-1111-111111111116', 'bicicletas', 'Bicicletas', '11111111-1111-1111-1111-111111111111', 5),
('11111111-1111-1111-1111-111111111117', 'pecas-auto', 'Peças e Acessórios', '11111111-1111-1111-1111-111111111111', 6);

-- 2. IMÓVEIS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('22222222-2222-2222-2222-222222222221', 'imoveis', 'Imóveis', 2);

-- Subcategorias de Imóveis
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('22222222-2222-2222-2222-222222222222', 'apartamentos-venda', 'Apartamentos à Venda', '22222222-2222-2222-2222-222222222221', 1),
('22222222-2222-2222-2222-222222222223', 'casas-venda', 'Casas à Venda', '22222222-2222-2222-2222-222222222221', 2),
('22222222-2222-2222-2222-222222222224', 'apartamentos-aluguel', 'Apartamentos para Alugar', '22222222-2222-2222-2222-222222222221', 3),
('22222222-2222-2222-2222-222222222225', 'casas-aluguel', 'Casas para Alugar', '22222222-2222-2222-2222-222222222221', 4),
('22222222-2222-2222-2222-222222222226', 'terrenos', 'Terrenos e Lotes', '22222222-2222-2222-2222-222222222221', 5),
('22222222-2222-2222-2222-222222222227', 'comerciais', 'Imóveis Comerciais', '22222222-2222-2222-2222-222222222221', 6);

-- 3. EMPREGOS E CARREIRAS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('33333333-3333-3333-3333-333333333331', 'empregos', 'Empregos e Carreiras', 3);

-- Subcategorias de Empregos
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('33333333-3333-3333-3333-333333333332', 'tempo-integral', 'Tempo Integral', '33333333-3333-3333-3333-333333333331', 1),
('33333333-3333-3333-3333-333333333333', 'meio-periodo', 'Meio Período', '33333333-3333-3333-3333-333333333331', 2),
('33333333-3333-3333-3333-333333333334', 'freelancer', 'Freelancer', '33333333-3333-3333-3333-333333333331', 3),
('33333333-3333-3333-3333-333333333335', 'tecnologia', 'Tecnologia e TI', '33333333-3333-3333-3333-333333333331', 4),
('33333333-3333-3333-3333-333333333336', 'vendas', 'Vendas e Comércio', '33333333-3333-3333-3333-333333333331', 5);

-- 4. ELETRÔNICOS E TECNOLOGIA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('44444444-4444-4444-4444-444444444441', 'eletronicos', 'Eletrônicos e Tecnologia', 4);

-- Subcategorias de Eletrônicos
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('44444444-4444-4444-4444-444444444442', 'celulares', 'Celulares e Smartphones', '44444444-4444-4444-4444-444444444441', 1),
('44444444-4444-4444-4444-444444444443', 'computadores', 'Computadores e Notebooks', '44444444-4444-4444-4444-444444444441', 2),
('44444444-4444-4444-4444-444444444444', 'tvs', 'TVs e Home Theater', '44444444-4444-4444-4444-444444444441', 3),
('44444444-4444-4444-4444-444444444445', 'games', 'Games e Consoles', '44444444-4444-4444-4444-444444444441', 4),
('44444444-4444-4444-4444-444444444446', 'cameras', 'Câmeras e Filmadoras', '44444444-4444-4444-4444-444444444441', 5);

-- 5. CASA E DECORAÇÃO
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('55555555-5555-5555-5555-555555555551', 'casa-decoracao', 'Casa e Decoração', 5);

-- Subcategorias de Casa
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('55555555-5555-5555-5555-555555555552', 'moveis', 'Móveis', '55555555-5555-5555-5555-555555555551', 1),
('55555555-5555-5555-5555-555555555553', 'decoracao', 'Decoração', '55555555-5555-5555-5555-555555555551', 2),
('55555555-5555-5555-5555-555555555554', 'eletrodomesticos', 'Eletrodomésticos', '55555555-5555-5555-5555-555555555551', 3),
('55555555-5555-5555-5555-555555555555', 'jardim', 'Jardim e Exterior', '55555555-5555-5555-5555-555555555551', 4);

-- 6. MODA E BELEZA
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('66666666-6666-6666-6666-666666666661', 'moda-beleza', 'Moda e Beleza', 6);

-- Subcategorias de Moda
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('66666666-6666-6666-6666-666666666662', 'roupas-femininas', 'Roupas Femininas', '66666666-6666-6666-6666-666666666661', 1),
('66666666-6666-6666-6666-666666666663', 'roupas-masculinas', 'Roupas Masculinas', '66666666-6666-6666-6666-666666666661', 2),
('66666666-6666-6666-6666-666666666664', 'calcados', 'Calçados', '66666666-6666-6666-6666-666666666661', 3),
('66666666-6666-6666-6666-666666666665', 'acessorios', 'Acessórios', '66666666-6666-6666-6666-666666666661', 4),
('66666666-6666-6666-6666-666666666666', 'beleza', 'Beleza e Cuidados', '66666666-6666-6666-6666-666666666661', 5);

-- 7. ESPORTES E LAZER
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('77777777-7777-7777-7777-777777777771', 'esportes-lazer', 'Esportes e Lazer', 7);

-- Subcategorias de Esportes
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('77777777-7777-7777-7777-777777777772', 'fitness', 'Fitness e Academia', '77777777-7777-7777-7777-777777777771', 1),
('77777777-7777-7777-7777-777777777773', 'futebol', 'Futebol', '77777777-7777-7777-7777-777777777771', 2),
('77777777-7777-7777-7777-777777777774', 'natacao', 'Natação e Esportes Aquáticos', '77777777-7777-7777-7777-777777777771', 3),
('77777777-7777-7777-7777-777777777775', 'ciclismo', 'Ciclismo e Corrida', '77777777-7777-7777-7777-777777777771', 4);

-- 8. SERVIÇOS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('88888888-8888-8888-8888-888888888881', 'servicos', 'Serviços', 8);

-- Subcategorias de Serviços
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('88888888-8888-8888-8888-888888888882', 'reformas', 'Reformas e Construção', '88888888-8888-8888-8888-888888888881', 1),
('88888888-8888-8888-8888-888888888883', 'limpeza', 'Limpeza e Organização', '88888888-8888-8888-8888-888888888881', 2),
('88888888-8888-8888-8888-888888888884', 'beleza-servicos', 'Beleza e Estética', '88888888-8888-8888-8888-888888888881', 3),
('88888888-8888-8888-8888-888888888885', 'eventos', 'Eventos e Festas', '88888888-8888-8888-8888-888888888881', 4);

-- 9. ANIMAIS E PETS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('99999999-9999-9999-9999-999999999991', 'animais-pets', 'Animais e Pets', 9);

-- Subcategorias de Animais
INSERT INTO categories (id, slug, name_pt, parent_id, position) VALUES 
('99999999-9999-9999-9999-999999999992', 'caes', 'Cães', '99999999-9999-9999-9999-999999999991', 1),
('99999999-9999-9999-9999-999999999993', 'gatos', 'Gatos', '99999999-9999-9999-9999-999999999991', 2),
('99999999-9999-9999-9999-999999999994', 'aves', 'Aves', '99999999-9999-9999-9999-999999999991', 3),
('99999999-9999-9999-9999-999999999995', 'acessorios-pets', 'Acessórios para Pets', '99999999-9999-9999-9999-999999999991', 4);

-- 10. OUTROS
INSERT INTO categories (id, slug, name_pt, position) VALUES 
('10101010-1010-1010-1010-101010101010', 'outros', 'Outros', 10);

-- ==========================================
-- CRIAR USUÁRIO DEMO PARA OS ANÚNCIOS
-- ==========================================

-- Inserir usuário demo (se não existir)
INSERT INTO profiles (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'demo@tudofaz.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ANÚNCIOS DEMO PARA CADA CATEGORIA
-- ==========================================

-- Carros (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111112', 'Honda Civic 2020 Automático', 'Honda Civic 2020, automático, completo, único dono, revisões em dia. Carro impecável!', 85000, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop');

-- Motos
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000002-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111113', 'Yamaha MT-07 2022', 'Yamaha MT-07 2022, poucos quilômetros, toda original. Moto esportiva em perfeito estado.', 35000, 'BRL', 'Rio de Janeiro, RJ', -22.9068, -43.1729, 'published', true, false, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop');

-- Apartamentos Venda (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000003-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Apartamento 3 Quartos Copacabana', 'Lindo apartamento de 3 quartos em Copacabana, vista para o mar, totalmente reformado.', 850000, 'BRL', 'Rio de Janeiro, RJ', -22.9711, -43.1822, 'published', true, true, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop');

-- Casas Venda
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000004-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222223', 'Casa 4 Quartos Alphaville', 'Casa moderna de 4 quartos em condomínio fechado, piscina, churrasqueira, jardim.', 1200000, 'BRL', 'Barueri, SP', -23.5147, -46.8761, 'published', true, false, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop');

-- Tecnologia Emprego (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000005-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333335', 'Desenvolvedor Full Stack Sênior', 'Vaga para desenvolvedor full stack sênior, React/Node.js, remoto ou híbrido.', 12000, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop');

-- Celulares (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000006-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444442', 'iPhone 14 Pro Max 256GB', 'iPhone 14 Pro Max 256GB, cor roxa, na caixa com todos os acessórios, sem riscos.', 5800, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop');

-- Computadores
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000007-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444443', 'MacBook Pro M2 16 polegadas', 'MacBook Pro M2 16", 32GB RAM, 1TB SSD, usado por 6 meses, garantia Apple.', 18000, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, false, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop');

-- Móveis (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000008-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555552', 'Sofá 3 Lugares Couro Legítimo', 'Sofá de 3 lugares em couro legítimo, cor marrom, muito confortável e conservado.', 2500, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop');

-- Roupas Femininas
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000009-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666662', 'Vestido Festa Longo Dourado', 'Vestido longo dourado para festa, tamanho M, usado apenas uma vez, marca renomada.', 350, 'BRL', 'Rio de Janeiro, RJ', -22.9068, -43.1729, 'published', true, false, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop');

-- Fitness (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000010-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777772', 'Esteira Elétrica Profissional', 'Esteira elétrica profissional, motor 3HP, velocidade até 20km/h, inclinação automática.', 3200, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop');

-- Reformas
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000011-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888882', 'Serviços de Reforma Completa', 'Reformas residenciais e comerciais, pintura, elétrica, hidráulica. Orçamento gratuito.', 0, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, false, 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop');

-- Cães (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000012-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999992', 'Filhote Golden Retriever', 'Filhotes de Golden Retriever, 2 meses, vacinados, pedigree, pais no local.', 1800, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop');