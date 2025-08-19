-- Corrigir funções sem search_path definido
CREATE OR REPLACE FUNCTION public.sync_site_settings_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- This function is no longer needed since we removed the public views
  -- Keep as placeholder for compatibility
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_pending_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Notificar admins sobre novo anúncio pendente
    PERFORM send_notification_email(
        'admin@tudofaz.com',
        'Novo anúncio pendente de aprovação',
        'Um novo anúncio foi enviado e está aguardando aprovação: ' || NEW.title
    );
    RETURN NEW;
END;
$function$;