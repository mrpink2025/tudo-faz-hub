-- Expandir sistema para incluir afiliados

-- Adicionar campos de afiliados na tabela listings
ALTER TABLE public.listings 
ADD COLUMN affiliate_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN affiliate_commission_rate INTEGER DEFAULT 0; -- Porcentagem x100 (ex: 1500 = 15%)

-- Atualizar enum de status dos pedidos  
ALTER TYPE order_status_type ADD VALUE IF NOT EXISTS 'in_analysis';
ALTER TYPE order_status_type ADD VALUE IF NOT EXISTS 'approved';

-- Criar tabela de afiliados
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE NOT NULL,
  pix_key TEXT,
  bank_account JSONB,
  total_earnings INTEGER DEFAULT 0, -- Em centavos
  available_balance INTEGER DEFAULT 0, -- Em centavos
  withdrawn_balance INTEGER DEFAULT 0, -- Em centavos
  status TEXT DEFAULT 'active', -- active, suspended, pending
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de solicitações de afiliação
CREATE TABLE public.affiliate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(affiliate_id, listing_id)
);

-- Criar tabela de links de afiliados
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tracking_code TEXT UNIQUE NOT NULL,
  clicks_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(affiliate_id, listing_id)
);

-- Criar tabela de cliques de afiliados
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  visitor_ip INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  order_id UUID REFERENCES public.orders(id)
);

-- Criar tabela de comissões
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  commission_rate INTEGER NOT NULL, -- Porcentagem x100
  commission_amount INTEGER NOT NULL, -- Em centavos
  order_amount INTEGER NOT NULL, -- Em centavos
  status TEXT DEFAULT 'pending', -- pending, confirmed, paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de saques
CREATE TABLE public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Em centavos
  pix_key TEXT,
  bank_account JSONB,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  admin_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Adicionar referência de afiliado na tabela orders
ALTER TABLE public.orders 
ADD COLUMN affiliate_id UUID REFERENCES public.affiliates(id),
ADD COLUMN affiliate_commission INTEGER DEFAULT 0, -- Em centavos
ADD COLUMN tracking_code TEXT;

-- Atualizar enum de status se não existir
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('pending', 'paid', 'canceled', 'in_analysis', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alterar coluna status para usar o enum (se não estiver usando)
-- ALTER TABLE public.orders ALTER COLUMN status TYPE order_status_type USING status::order_status_type;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- Políticas para affiliates
CREATE POLICY "Users can view their own affiliate profile" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own affiliate profile" ON public.affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own affiliate profile" ON public.affiliates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all affiliates" ON public.affiliates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para affiliate_requests
CREATE POLICY "Affiliates can view their own requests" ON public.affiliate_requests
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can create requests" ON public.affiliate_requests
  FOR INSERT WITH CHECK (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Listing owners can view requests for their listings" ON public.affiliate_requests
  FOR SELECT USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "Listing owners can update requests for their listings" ON public.affiliate_requests
  FOR UPDATE USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all affiliate requests" ON public.affiliate_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para affiliate_links
CREATE POLICY "Affiliates can view their own links" ON public.affiliate_links
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active affiliate links" ON public.affiliate_links
  FOR SELECT USING (true);

CREATE POLICY "System can update affiliate links" ON public.affiliate_links
  FOR UPDATE USING (true);

-- Políticas para affiliate_clicks
CREATE POLICY "System can insert clicks" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Affiliates can view clicks on their links" ON public.affiliate_clicks
  FOR SELECT USING (
    affiliate_link_id IN (
      SELECT id FROM affiliate_links 
      WHERE affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    )
  );

-- Políticas para affiliate_commissions
CREATE POLICY "Affiliates can view their own commissions" ON public.affiliate_commissions
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Listing owners can view commissions for their listings" ON public.affiliate_commissions
  FOR SELECT USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para affiliate_withdrawals
CREATE POLICY "Affiliates can view their own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can create withdrawal requests" ON public.affiliate_withdrawals
  FOR INSERT WITH CHECK (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all withdrawals" ON public.affiliate_withdrawals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices para performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliate_requests_listing_id ON public.affiliate_requests(listing_id);
CREATE INDEX idx_affiliate_requests_affiliate_id ON public.affiliate_requests(affiliate_id);
CREATE INDEX idx_affiliate_links_tracking_code ON public.affiliate_links(tracking_code);
CREATE INDEX idx_affiliate_clicks_affiliate_link_id ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);
CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX idx_orders_affiliate_id ON public.orders(affiliate_id);
CREATE INDEX idx_orders_tracking_code ON public.orders(tracking_code);

-- Triggers para updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_requests_updated_at
  BEFORE UPDATE ON public.affiliate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code() 
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 8 caracteres
    code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    code := replace(code, '+', '');
    code := replace(code, '/', '');
    code := replace(code, '=', '');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar código de tracking único
CREATE OR REPLACE FUNCTION generate_tracking_code() 
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 12 caracteres
    code := lower(substring(encode(gen_random_bytes(9), 'base64') from 1 for 12));
    code := replace(code, '+', '');
    code := replace(code, '/', '');
    code := replace(code, '=', '');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM affiliate_links WHERE tracking_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;