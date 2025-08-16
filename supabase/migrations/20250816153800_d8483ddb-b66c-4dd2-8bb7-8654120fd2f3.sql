-- Atualizar a função create-product-checkout para processar afiliados automaticamente
-- Esta função será usada no edge function existente

-- Criar função para processar comissão de afiliado automaticamente
CREATE OR REPLACE FUNCTION public.process_affiliate_commission_on_order()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_rec RECORD;
  commission_amount INTEGER;
BEGIN
  -- Verificar se o pedido tem afiliado e foi confirmado
  IF NEW.affiliate_id IS NOT NULL AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    
    -- Buscar informações do afiliado
    SELECT * INTO affiliate_rec 
    FROM affiliates 
    WHERE id = NEW.affiliate_id;
    
    IF affiliate_rec.id IS NOT NULL THEN
      -- Calcular comissão (NEW.affiliate_commission já vem em centavos)
      commission_amount := NEW.affiliate_commission;
      
      -- Criar registro de comissão
      INSERT INTO affiliate_commissions (
        affiliate_id,
        order_id,
        listing_id,
        order_amount,
        commission_rate,
        commission_amount,
        status
      ) VALUES (
        NEW.affiliate_id,
        NEW.id,
        NEW.listing_id,
        NEW.amount,
        -- Calcular taxa baseada na comissão
        CASE WHEN NEW.amount > 0 
          THEN (commission_amount * 100 / NEW.amount) 
          ELSE 0 
        END,
        commission_amount,
        'approved'
      );
      
      -- Atualizar saldo do afiliado
      UPDATE affiliates 
      SET 
        total_earnings = COALESCE(total_earnings, 0) + commission_amount,
        available_balance = COALESCE(available_balance, 0) + commission_amount,
        updated_at = NOW()
      WHERE id = NEW.affiliate_id;
      
      -- Criar notificação para o afiliado
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type
      ) VALUES (
        affiliate_rec.user_id,
        'Nova Comissão Recebida!',
        'Você recebeu R$ ' || (commission_amount::FLOAT / 100)::TEXT || ' de comissão por uma venda.',
        'success'
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para processar comissões automaticamente
DROP TRIGGER IF EXISTS trigger_process_affiliate_commission ON public.orders;
CREATE TRIGGER trigger_process_affiliate_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_affiliate_commission_on_order();

-- Função para rastrear cliques de afiliados automaticamente
CREATE OR REPLACE FUNCTION public.track_affiliate_click_and_conversion()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_link_rec RECORD;
  referrer_tracking_code TEXT;
BEGIN
  -- Extrair código de rastreamento do referrer ou metadata
  -- Esta é uma simulação - na prática viria do frontend
  
  -- Buscar o link de afiliado ativo mais recente para esta listing
  SELECT al.*, a.user_id as affiliate_user_id 
  INTO affiliate_link_rec
  FROM affiliate_links al
  JOIN affiliates a ON al.affiliate_id = a.id
  WHERE al.listing_id = NEW.listing_id
  ORDER BY al.created_at DESC
  LIMIT 1;
  
  IF affiliate_link_rec.id IS NOT NULL THEN
    -- Atualizar o pedido com informações do afiliado
    UPDATE orders 
    SET 
      affiliate_id = affiliate_link_rec.affiliate_id,
      affiliate_commission = CASE 
        WHEN NEW.amount > 0 THEN 
          (NEW.amount * COALESCE(
            (SELECT affiliate_commission_rate FROM listings WHERE id = NEW.listing_id), 
            5
          ) / 100)
        ELSE 0
      END
    WHERE id = NEW.id;
    
    -- Registrar o clique como conversão
    INSERT INTO affiliate_clicks (
      affiliate_link_id,
      order_id,
      converted,
      clicked_at
    ) VALUES (
      affiliate_link_rec.id,
      NEW.id,
      true,
      NOW()
    );
    
    -- Atualizar contador de cliques do link
    UPDATE affiliate_links 
    SET 
      clicks_count = COALESCE(clicks_count, 0) + 1,
      last_clicked_at = NOW()
    WHERE id = affiliate_link_rec.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para rastrear conversões automaticamente quando pedido é criado
DROP TRIGGER IF EXISTS trigger_track_affiliate_conversion ON public.orders;
CREATE TRIGGER trigger_track_affiliate_conversion
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_affiliate_click_and_conversion();