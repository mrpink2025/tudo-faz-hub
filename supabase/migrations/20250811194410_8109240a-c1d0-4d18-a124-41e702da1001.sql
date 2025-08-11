-- Ensure unique slugs for categories
create unique index if not exists categories_slug_key on public.categories(slug);

-- Root categories
insert into public.categories (name_pt, name_zh, slug, position, parent_id)
values
  ('Empregos', '工作', 'empregos', 1, null),
  ('Imóveis', '房', 'imoveis', 2, null),
  ('Serviços Diversos', '服务', 'servicos-diversos', 3, null),
  ('Veículos', '车', 'veiculos', 4, null),
  ('Vida Doméstica e Cotidiana', '生活', 'vida-cotidiana', 5, null),
  ('Serviços Financeiros', '金融', 'servicos-financeiros', 6, null)
on conflict (slug) do nothing;

-- Empregos subcategories
insert into public.categories (name_pt, name_zh, slug, parent_id, position)
values
  ('Empregos em tempo integral', '全职工作', 'empregos-tempo-integral', (select id from public.categories where slug='empregos'), 1),
  ('Empregos de meio período', '兼职工作', 'empregos-meio-periodo', (select id from public.categories where slug='empregos'), 2),
  ('Contratação imediata', '快速招人', 'contratacao-imediata', (select id from public.categories where slug='empregos'), 3),
  ('Vagas próximas à localização', '附近工作', 'vagas-proximas', (select id from public.categories where slug='empregos'), 4),
  ('Vagas com contratação urgente', '急招职位', 'vagas-urgentes', (select id from public.categories where slug='empregos'), 5),
  ('Oportunidades para pessoas com deficiência', '残疾人就业', 'oportunidades-pcd', (select id from public.categories where slug='empregos'), 6),
  ('Formação profissional', '58职教', 'formacao-profissional', (select id from public.categories where slug='empregos'), 7),
  ('Recrutamento por transmissão ao vivo', '直播招聘', 'recrutamento-ao-vivo', (select id from public.categories where slug='empregos'), 8),
  ('Trabalhos temporários próximo', '附近兼职', 'trabalhos-temporarios-proximos', (select id from public.categories where slug='empregos'), 9),
  ('Vagas para motoristas', '司机招聘', 'motoristas', (select id from public.categories where slug='empregos'), 10),
  ('Vagas para assistentes administrativos', '文员招聘', 'assistentes-administrativos', (select id from public.categories where slug='empregos'), 11),
  ('Vagas para seguranças', '保安招聘', 'segurancas', (select id from public.categories where slug='empregos'), 12)
ON CONFLICT (slug) DO NOTHING;

-- Imóveis subcategories
insert into public.categories (name_pt, name_zh, slug, parent_id, position)
values
  ('Imóveis residenciais usados', '二手房', 'imoveis-usados', (select id from public.categories where slug='imoveis'), 1),
  ('Imóveis residenciais novos', '新房', 'imoveis-novos', (select id from public.categories where slug='imoveis'), 2),
  ('Apartamentos', '品牌公寓', 'apartamentos', (select id from public.categories where slug='imoveis'), 3),
  ('Aluguel completo (exclusividade)', '整租', 'aluguel-completo', (select id from public.categories where slug='imoveis'), 4),
  ('Aluguel compartilhado', '合租', 'aluguel-compartilhado', (select id from public.categories where slug='imoveis'), 5),
  ('Compra de lojas comerciais', '买商铺', 'compra-lojas-comerciais', (select id from public.categories where slug='imoveis'), 6),
  ('Imóvel com contrato de aluguel garantido', '保租房', 'aluguel-garantido', (select id from public.categories where slug='imoveis'), 7),
  ('Aluguel direto com o proprietário', '房东直租', 'aluguel-direto-proprietario', (select id from public.categories where slug='imoveis'), 8),
  ('Procura por colega de quarto', '找室友', 'procura-colega-quarto', (select id from public.categories where slug='imoveis'), 9),
  ('Escritório compartilhado (coworking)', '联合办公', 'coworking', (select id from public.categories where slug='imoveis'), 10),
  ('Transferência de ponto comercial', '生意转让', 'transferencia-ponto-comercial', (select id from public.categories where slug='imoveis'), 11),
  ('Compra de escritórios comerciais', '买写字楼', 'compra-escritorios-comerciais', (select id from public.categories where slug='imoveis'), 12),
  ('Compra de galpões industriais', '买厂房', 'compra-galpoes-industriais', (select id from public.categories where slug='imoveis'), 13),
  ('Aluguel de depósitos/galpões', '租仓库', 'aluguel-depositos-galpoes', (select id from public.categories where slug='imoveis'), 14),
  ('Compra de depósitos/galpões', '买仓库', 'compra-depositos-galpoes', (select id from public.categories where slug='imoveis'), 15),
  ('Aluguel de fábricas/galpões industriais', '租厂房', 'aluguel-galpoes-industriais', (select id from public.categories where slug='imoveis'), 16),
  ('Conjuntos comerciais para escritório', '办公楼盘', 'conjuntos-comerciais-escritorio', (select id from public.categories where slug='imoveis'), 17),
  ('Aluguel de salas comerciais', '租写字楼', 'aluguel-salas-comerciais', (select id from public.categories where slug='imoveis'), 18),
  ('Aluguel de curta duração (estilo Airbnb)', '民宿短租', 'aluguel-curta-duracao', (select id from public.categories where slug='imoveis'), 19),
  ('Aluguel de lojas comerciais', '租商铺', 'aluguel-lojas-comerciais', (select id from public.categories where slug='imoveis'), 20),
  ('Estimativa de custo para reforma', '装修估价', 'estimativa-reforma', (select id from public.categories where slug='imoveis'), 21),
  ('Simulador de projeto de reforma', '模拟装修', 'simulador-reforma', (select id from public.categories where slug='imoveis'), 22),
  ('Avaliação de imóveis', '房屋估价', 'avaliacao-imoveis', (select id from public.categories where slug='imoveis'), 23)
ON CONFLICT (slug) DO NOTHING;

-- Serviços Diversos subcategories
insert into public.categories (name_pt, name_zh, slug, parent_id, position)
values
  ('Registro de empresas', '工商注册', 'registro-empresas', (select id from public.categories where slug='servicos-diversos'), 1),
  ('Serviços de locação diversos', '租赁', 'servicos-locacao', (select id from public.categories where slug='servicos-diversos'), 2),
  ('Transporte de cargas e logística', '货运物流', 'logistica', (select id from public.categories where slug='servicos-diversos'), 3),
  ('Impressão de placas publicitárias', '喷绘招牌', 'impressao-placas', (select id from public.categories where slug='servicos-diversos'), 4),
  ('Franquias no ramo alimentício', '餐饮加盟', 'franquias-alimenticio', (select id from public.categories where slug='servicos-diversos'), 5),
  ('Franquias e parcerias comerciais', '招商加盟', 'franquias-parcerias', (select id from public.categories where slug='servicos-diversos'), 6),
  ('Instalação e cabeamento de redes', '网络布线', 'instalacao-redes', (select id from public.categories where slug='servicos-diversos'), 7),
  ('Consultoria jurídica', '法律咨询', 'consultoria-juridica', (select id from public.categories where slug='servicos-diversos'), 8),
  ('Serviço especializado de mudanças', '精选搬家', 'mudancas-especializadas', (select id from public.categories where slug='servicos-diversos'), 9),
  ('Capacitação e formação profissional', '职业培训', 'capacitacao-profissional', (select id from public.categories where slug='servicos-diversos'), 10),
  ('Criação de websites', '网站建设', 'criacao-websites', (select id from public.categories where slug='servicos-diversos'), 11),
  ('Materiais para construção e reforma', '装修建材', 'materiais-construcao', (select id from public.categories where slug='servicos-diversos'), 12),
  ('Serviços domésticos', '家政工作', 'servicos-domesticos', (select id from public.categories where slug='servicos-diversos'), 13),
  ('Abertura e troca de fechaduras', '开锁换锁', 'chaveiro', (select id from public.categories where slug='servicos-diversos'), 14),
  ('Assistência técnica para computadores', '电脑维修', 'assistencia-computador', (select id from public.categories where slug='servicos-diversos'), 15),
  ('Reforma e ambientação comercial', '公装', 'reforma-comercial', (select id from public.categories where slug='servicos-diversos'), 16)
ON CONFLICT (slug) DO NOTHING;

-- Veículos subcategories
insert into public.categories (name_pt, name_zh, slug, parent_id, position)
values
  ('Carros novos', '新车', 'carros-novos', (select id from public.categories where slug='veiculos'), 1),
  ('Caminhões', '货车', 'caminhoes', (select id from public.categories where slug='veiculos'), 2),
  ('Veículos de construção', '工程车', 'veiculos-construcao', (select id from public.categories where slug='veiculos'), 3),
  ('Ônibus e vans', '客车', 'onibus-vans', (select id from public.categories where slug='veiculos'), 4),
  ('Aluguel de veículos', '租车', 'aluguel-veiculos', (select id from public.categories where slug='veiculos'), 5),
  ('Autoescolas', '驾校', 'autoescolas', (select id from public.categories where slug='veiculos'), 6),
  ('Serviço de motorista particular', '代驾', 'motorista-particular', (select id from public.categories where slug='veiculos'), 7),
  ('Estética e personalização de veículos', '美容装饰', 'estetica-veicular', (select id from public.categories where slug='veiculos'), 8),
  ('Manutenção e revisões automotivas', '维修保养', 'manutencao-automotiva', (select id from public.categories where slug='veiculos'), 9),
  ('Transferência e inspeção de veículos', '过户验车', 'transferencia-inspecao', (select id from public.categories where slug='veiculos'), 10),
  ('Carros usados', '二手车', 'carros-usados', (select id from public.categories where slug='veiculos'), 11),
  ('Empréstimo com garantia de veículo', '58车抵贷', 'emprestimo-garantia-veiculo', (select id from public.categories where slug='veiculos'), 12)
ON CONFLICT (slug) DO NOTHING;

-- Vida Doméstica e Cotidiana subcategories
insert into public.categories (name_pt, name_zh, slug, parent_id, position)
values
  ('Recarga de celular', '话费充值', 'recarga-celular', (select id from public.categories where slug='vida-cotidiana'), 1),
  ('Serviços de mudança', '搬家搬运', 'servicos-mudanca', (select id from public.categories where slug='vida-cotidiana'), 2),
  ('Limpeza e higienização', '保洁清洗', 'limpeza-higienizacao', (select id from public.categories where slug='vida-cotidiana'), 3),
  ('Babás e cuidadoras', '保姆月嫂', 'babás-cuidadoras', (select id from public.categories where slug='vida-cotidiana'), 4),
  ('Faxineiras por hora', '找钟点工', 'faxineiras-por-hora', (select id from public.categories where slug='vida-cotidiana'), 5),
  ('Reparos residenciais', '房屋维修', 'reparos-residenciais', (select id from public.categories where slug='vida-cotidiana'), 6),
  ('Manutenção de eletrodomésticos', '家电维修', 'manutencao-eletrodomesticos', (select id from public.categories where slug='vida-cotidiana'), 7),
  ('Desentupimento hidráulico', '管道疏通', 'desentupimento-hidraulico', (select id from public.categories where slug='vida-cotidiana'), 8),
  ('Conserto de móveis', '家具维修', 'conserto-moveis', (select id from public.categories where slug='vida-cotidiana'), 9),
  ('Decoração de interiores', '家装', 'decoracao-interiores', (select id from public.categories where slug='vida-cotidiana'), 10),
  ('Reparo de instalações hidráulicas, elétricas e aquecimento', '水电暖维修', 'reparo-instalacoes', (select id from public.categories where slug='vida-cotidiana'), 11),
  ('Materiais de construção', '建材', 'materiais-construcao-vida', (select id from public.categories where slug='vida-cotidiana'), 12),
  ('Reconstrução ou reforma de casas', '建房翻建', 'reconstrucao-casas', (select id from public.categories where slug='vida-cotidiana'), 13),
  ('Serviços de entrega domiciliar', '生活配送', 'entrega-domiciliar', (select id from public.categories where slug='vida-cotidiana'), 14),
  ('Coleta e reciclagem de usados', '二手回收', 'coleta-reciclagem', (select id from public.categories where slug='vida-cotidiana'), 15),
  ('Móveis usados', '二手家具', 'moveis-usados', (select id from public.categories where slug='vida-cotidiana'), 16),
  ('Eletrodomésticos usados', '二手家电', 'eletrodomesticos-usados', (select id from public.categories where slug='vida-cotidiana'), 17),
  ('Computadores usados', '二手电脑', 'computadores-usados', (select id from public.categories where slug='vida-cotidiana'), 18),
  ('Celulares usados', '二手手机', 'celulares-usados', (select id from public.categories where slug='vida-cotidiana'), 19),
  ('Motos usadas', '二手摩托车', 'motos-usadas', (select id from public.categories where slug='vida-cotidiana'), 20),
  ('Cursos técnicos e profissionalizantes', '技能培训', 'cursos-tecnicos', (select id from public.categories where slug='vida-cotidiana'), 21),
  ('Animais de estimação', '宠物', 'animais-estimacao', (select id from public.categories where slug='vida-cotidiana'), 22),
  ('Bicicletas elétricas', '电动自行车', 'bicicletas-eletricas', (select id from public.categories where slug='vida-cotidiana'), 23),
  ('Limpeza de imóveis para aluguel', '租房保洁', 'limpeza-imoveis-aluguel', (select id from public.categories where slug='vida-cotidiana'), 24)
ON CONFLICT (slug) DO NOTHING;

-- Serviços Financeiros subcategories
insert into public.categories (name_pt, name_zh, slug, parent_id, position)
values
  ('Empréstimo pessoal para consumo', '58消费贷', 'emprestimo-pessoal-consumo', (select id from public.categories where slug='servicos-financeiros'), 1),
  ('Empréstimos de alto valor', '58大额贷', 'emprestimos-alto-valor', (select id from public.categories where slug='servicos-financeiros'), 2),
  ('Seguros (diversos tipos)', '保险', 'seguros', (select id from public.categories where slug='servicos-financeiros'), 3)
ON CONFLICT (slug) DO NOTHING;

-- Messages table for chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  recipient_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Policies
create policy if not exists "Users can insert their own messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy if not exists "Users can view their own conversations"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
