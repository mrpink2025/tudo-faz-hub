-- Corrigir problemas de segurança das funções
DROP FUNCTION IF EXISTS send_notification_email(text, text, text);
DROP FUNCTION IF EXISTS notify_pending_listing();
DROP TRIGGER IF EXISTS listing_pending_notification ON listings;

-- Recriar funções com search_path correto
CREATE OR REPLACE FUNCTION public.send_notification_email(
    user_email text,
    subject text,
    message text
) RETURNS void AS $$
BEGIN
    -- Função placeholder para notificações por email
    -- Em produção, chamaria uma edge function
    RAISE NOTICE 'Email notification would be sent to % with subject: %', user_email, subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recriar função de trigger com search_path correto
CREATE OR REPLACE FUNCTION public.notify_pending_listing() RETURNS trigger AS $$
BEGIN
    -- Notificar sobre novo anúncio pendente
    PERFORM public.send_notification_email(
        'admin@tudofaz.com',
        'Novo anúncio pendente de aprovação',
        'Um novo anúncio foi enviado e está aguardando aprovação: ' || NEW.title
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recriar trigger
CREATE TRIGGER listing_pending_notification
    AFTER INSERT ON public.listings
    FOR EACH ROW
    WHEN (NEW.approved = false)
    EXECUTE FUNCTION public.notify_pending_listing();