-- Criar políticas RLS e funções auxiliares para o sistema de afiliados

-- Criar funções auxiliares para gerar códigos únicos
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Políticas RLS para a tabela affiliates
CREATE POLICY "Users can view their own affiliate profile" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own affiliate profile" ON public.affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own affiliate profile" ON public.affiliates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all affiliates" ON public.affiliates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para a tabela affiliate_requests
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

-- Políticas RLS para a tabela affiliate_links
CREATE POLICY "Affiliates can view their own links" ON public.affiliate_links
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can create their own links" ON public.affiliate_links
  FOR INSERT WITH CHECK (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active affiliate links for tracking" ON public.affiliate_links
  FOR SELECT USING (true);

CREATE POLICY "System can update affiliate links clicks" ON public.affiliate_links
  FOR UPDATE USING (true);

-- Políticas RLS para a tabela affiliate_clicks  
CREATE POLICY "System can insert clicks" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Affiliates can view clicks on their links" ON public.affiliate_clicks
  FOR SELECT USING (
    affiliate_link_id IN (
      SELECT id FROM affiliate_links 
      WHERE affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all clicks" ON public.affiliate_clicks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para a tabela affiliate_commissions
CREATE POLICY "Affiliates can view their own commissions" ON public.affiliate_commissions
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Listing owners can view commissions for their listings" ON public.affiliate_commissions
  FOR SELECT USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create commissions" ON public.affiliate_commissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update commissions" ON public.affiliate_commissions
  FOR UPDATE USING (true);

-- Políticas RLS para a tabela affiliate_withdrawals
CREATE POLICY "Affiliates can view their own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can create withdrawal requests" ON public.affiliate_withdrawals
  FOR INSERT WITH CHECK (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all withdrawals" ON public.affiliate_withdrawals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_requests_listing_id ON public.affiliate_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_requests_affiliate_id ON public.affiliate_requests(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tracking_code ON public.affiliate_links(tracking_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_link_id ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON public.orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_requests_updated_at
  BEFORE UPDATE ON public.affiliate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();