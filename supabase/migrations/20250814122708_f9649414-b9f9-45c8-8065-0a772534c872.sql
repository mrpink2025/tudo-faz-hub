-- Criar edge function para envio de notificações por email
CREATE OR REPLACE FUNCTION send_notification_email(
    user_email text,
    subject text,
    message text
) RETURNS void AS $$
BEGIN
    -- Registrar notificação na tabela (se necessário criar tabela de notificações)
    -- Por enquanto apenas uma função placeholder que pode ser chamada via trigger
    RAISE NOTICE 'Email notification would be sent to % with subject: %', user_email, subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para notificar sobre novos anúncios pendentes
CREATE OR REPLACE FUNCTION notify_pending_listing() RETURNS trigger AS $$
BEGIN
    -- Notificar admins sobre novo anúncio pendente
    PERFORM send_notification_email(
        'admin@tudofaz.com',
        'Novo anúncio pendente de aprovação',
        'Um novo anúncio foi enviado e está aguardando aprovação: ' || NEW.title
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger apenas se não existir
DROP TRIGGER IF EXISTS listing_pending_notification ON listings;
CREATE TRIGGER listing_pending_notification
    AFTER INSERT ON listings
    FOR EACH ROW
    WHEN (NEW.approved = false)
    EXECUTE FUNCTION notify_pending_listing();