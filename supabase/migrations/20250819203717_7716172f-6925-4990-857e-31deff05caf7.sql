-- Atualizar função send_notification_email para usar edge function do Resend
CREATE OR REPLACE FUNCTION public.send_notification_email(user_email text, subject text, message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    response text;
BEGIN
    -- Fazer chamada para a edge function do Resend via HTTP
    SELECT content::text INTO response
    FROM http((
        'POST',
        'https://jprmzutdujnufjyvxtss.supabase.co/functions/v1/send-notification',
        ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
            http_header('Content-Type', 'application/json')
        ],
        json_build_object(
            'to', user_email,
            'subject', subject,
            'message', message,
            'type', 'info'
        )::text
    ));
    
    -- Log sucesso
    RAISE NOTICE 'Email notification sent via Resend to %: %', user_email, subject;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log erro mas não falha
        RAISE NOTICE 'Failed to send email notification to %: %', user_email, SQLERRM;
END;
$$;