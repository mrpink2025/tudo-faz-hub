-- ==========================================
-- ANÚNCIOS DEMO PARA CADA CATEGORIA
-- ==========================================

-- Carros (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000001-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '11111111-1111-1111-1111-111111111112', 'Honda Civic 2020 Automático', 'Honda Civic 2020, automático, completo, único dono, revisões em dia. Carro impecável!', 85000, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop');

-- Motos
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000002-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '11111111-1111-1111-1111-111111111113', 'Yamaha MT-07 2022', 'Yamaha MT-07 2022, poucos quilômetros, toda original. Moto esportiva em perfeito estado.', 35000, 'BRL', 'Rio de Janeiro, RJ', -22.9068, -43.1729, 'published', true, false, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop');

-- Apartamentos Venda (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000003-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '22222222-2222-2222-2222-222222222222', 'Apartamento 3 Quartos Copacabana', 'Lindo apartamento de 3 quartos em Copacabana, vista para o mar, totalmente reformado.', 850000, 'BRL', 'Rio de Janeiro, RJ', -22.9711, -43.1822, 'published', true, true, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop');

-- Casas Venda
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000004-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '22222222-2222-2222-2222-222222222223', 'Casa 4 Quartos Alphaville', 'Casa moderna de 4 quartos em condomínio fechado, piscina, churrasqueira, jardim.', 1200000, 'BRL', 'Barueri, SP', -23.5147, -46.8761, 'published', true, false, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop');

-- Tecnologia Emprego (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000005-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '33333333-3333-3333-3333-333333333335', 'Desenvolvedor Full Stack Sênior', 'Vaga para desenvolvedor full stack sênior, React/Node.js, remoto ou híbrido.', 12000, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop');

-- Celulares (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000006-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '44444444-4444-4444-4444-444444444442', 'iPhone 14 Pro Max 256GB', 'iPhone 14 Pro Max 256GB, cor roxa, na caixa com todos os acessórios, sem riscos.', 5800, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop');

-- Computadores
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000007-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '44444444-4444-4444-4444-444444444443', 'MacBook Pro M2 16 polegadas', 'MacBook Pro M2 16", 32GB RAM, 1TB SSD, usado por 6 meses, garantia Apple.', 18000, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, false, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop');

-- Móveis (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000008-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '55555555-5555-5555-5555-555555555552', 'Sofá 3 Lugares Couro Legítimo', 'Sofá de 3 lugares em couro legítimo, cor marrom, muito confortável e conservado.', 2500, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop');

-- Roupas Femininas
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000009-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '66666666-6666-6666-6666-666666666662', 'Vestido Festa Longo Dourado', 'Vestido longo dourado para festa, tamanho M, usado apenas uma vez, marca renomada.', 350, 'BRL', 'Rio de Janeiro, RJ', -22.9068, -43.1729, 'published', true, false, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop');

-- Fitness (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000010-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '77777777-7777-7777-7777-777777777772', 'Esteira Elétrica Profissional', 'Esteira elétrica profissional, motor 3HP, velocidade até 20km/h, inclinação automática.', 3200, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop');

-- Reformas
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000011-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '88888888-8888-8888-8888-888888888882', 'Serviços de Reforma Completa', 'Reformas residenciais e comerciais, pintura, elétrica, hidráulica. Orçamento gratuito.', 0, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, false, 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop');

-- Cães (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000012-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '99999999-9999-9999-9999-999999999992', 'Filhote Golden Retriever', 'Filhotes de Golden Retriever, 2 meses, vacinados, pedigree, pais no local.', 1800, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop');

-- Terrenos
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000013-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '22222222-2222-2222-2222-222222222226', 'Terreno 1000m² Condomínio', 'Terreno plano de 1000m² em condomínio fechado, pronto para construir, documentação ok.', 300000, 'BRL', 'Jundiaí, SP', -23.1862, -46.8979, 'published', true, false, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop');

-- Games (DESTACADO)
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000014-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '44444444-4444-4444-4444-444444444445', 'PlayStation 5 com 2 Controles', 'PlayStation 5 novo na caixa, 2 controles DualSense, 5 jogos inclusos. Garantia de 1 ano.', 2800, 'BRL', 'São Paulo, SP', -23.5505, -46.6333, 'published', true, true, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop');

-- Gatos
INSERT INTO listings (id, user_id, category_id, title, description, price, currency, location, lat, lng, status, approved, highlighted, cover_image) VALUES 
('aa000015-0000-0000-0000-000000000000', '8bb0e255-8bda-475f-a942-de50ad93f71b', '99999999-9999-9999-9999-999999999993', 'Gato Persa Filhote', 'Filhote de gato persa, 3 meses, vacinado, vermifugado, pedigree. Muito carinhoso!', 800, 'BRL', 'Rio de Janeiro, RJ', -22.9068, -43.1729, 'published', true, false, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop');