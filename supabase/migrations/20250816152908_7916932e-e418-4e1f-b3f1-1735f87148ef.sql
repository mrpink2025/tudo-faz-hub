-- Adicionar campos de tracking e notificações aos pedidos
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS seller_notes TEXT;

-- Criar tabela de notificações de pedidos
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seller_id UUID,
  type TEXT NOT NULL CHECK (type IN ('order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_order_notifications_user_id ON public.order_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_seller_id ON public.order_notifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON public.order_notifications(order_id);

-- Habilitar RLS na tabela de notificações
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações de pedidos
CREATE POLICY "Users can view their own order notifications" 
ON public.order_notifications FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = seller_id);

CREATE POLICY "System can insert order notifications" 
ON public.order_notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.order_notifications FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = seller_id);

-- Função para criar notificações automáticas de pedidos
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar vendedor sobre novo pedido
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_notifications (
      order_id, user_id, seller_id, type, title, message
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.seller_id,
      'order_placed',
      'Novo Pedido Recebido',
      'Você recebeu um novo pedido no valor de R$ ' || COALESCE((NEW.amount::FLOAT / 100)::TEXT, '0') || '.'
    );
    
    -- Notificar comprador sobre confirmação do pedido
    INSERT INTO public.order_notifications (
      order_id, user_id, seller_id, type, title, message
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.seller_id,
      'order_confirmed',
      'Pedido Confirmado',
      'Seu pedido foi confirmado e está sendo processado.'
    );
    
    RETURN NEW;
  END IF;
  
  -- Notificações para mudanças de status
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'shipped' THEN
      INSERT INTO public.order_notifications (
        order_id, user_id, seller_id, type, title, message
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.seller_id,
        'order_shipped',
        'Pedido Enviado',
        'Seu pedido foi enviado' || CASE WHEN NEW.tracking_code IS NOT NULL 
          THEN ' com código de rastreamento: ' || NEW.tracking_code 
          ELSE '.' END
      );
    ELSIF NEW.status = 'delivered' THEN
      INSERT INTO public.order_notifications (
        order_id, user_id, seller_id, type, title, message
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.seller_id,
        'order_delivered',
        'Pedido Entregue',
        'Seu pedido foi entregue com sucesso!'
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.order_notifications (
        order_id, user_id, seller_id, type, title, message
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.seller_id,
        'order_cancelled',
        'Pedido Cancelado',
        'Seu pedido foi cancelado.'
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para notificações automáticas
DROP TRIGGER IF EXISTS trigger_order_notifications ON public.orders;
CREATE TRIGGER trigger_order_notifications
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_notification();