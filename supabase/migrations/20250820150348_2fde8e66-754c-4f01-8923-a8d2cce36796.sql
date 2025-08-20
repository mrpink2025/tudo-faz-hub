-- Adicionar campo para usuários confiáveis que não precisam de validação
ALTER TABLE public.profiles 
ADD COLUMN trusted_seller boolean NOT NULL DEFAULT false;

-- Atualizar função de auto-aprovação para incluir usuários confiáveis
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email text;
    is_trusted boolean;
BEGIN
    -- Get the user's email and trusted status
    SELECT email, trusted_seller INTO user_email, is_trusted
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Auto-approve listings for trusted users or specific emails
    IF user_email = 'BDMimporta@gmail.com' OR is_trusted = true THEN
        NEW.approved := true;
    END IF;
    
    RETURN NEW;
END;
$function$;