-- Corrigir search_path nas funções existentes que estão faltando
-- Atualizar funções que não têm search_path definido

-- Função auto_approve_trusted_users - adicionar search_path
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    is_trusted boolean;
BEGIN
    -- Get the user's trusted seller status
    SELECT trusted_seller INTO is_trusted
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Auto-approve listings ONLY for trusted users (removed hardcoded email backdoor)
    IF is_trusted = true THEN
        NEW.approved := true;
        
        -- Log the auto-approval for audit trail
        INSERT INTO activity_logs (
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            NEW.user_id,
            'listing_auto_approved',
            'Listing auto-approved for trusted seller',
            jsonb_build_object(
                'listing_id', NEW.id,
                'listing_title', NEW.title,
                'auto_approved_reason', 'trusted_seller'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Função log_trusted_seller_changes - adicionar search_path
CREATE OR REPLACE FUNCTION public.log_trusted_seller_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Log when trusted_seller status changes
    IF OLD.trusted_seller IS DISTINCT FROM NEW.trusted_seller THEN
        INSERT INTO activity_logs (
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            auth.uid(), -- Admin who made the change
            'trusted_seller_status_changed',
            CASE 
                WHEN NEW.trusted_seller = true THEN 'User granted trusted seller status'
                ELSE 'User trusted seller status revoked'
            END,
            jsonb_build_object(
                'target_user_id', NEW.id,
                'target_user_email', NEW.email,
                'old_status', OLD.trusted_seller,
                'new_status', NEW.trusted_seller,
                'changed_by', auth.uid()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Função log_role_change - adicionar search_path
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log role changes for audit trail
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.security_audit_log (
      user_id,
      admin_user_id,
      action,
      details
    ) VALUES (
      NEW.user_id,
      auth.uid(),
      'role_granted',
      jsonb_build_object(
        'role', NEW.role,
        'granted_at', now()
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (
      user_id,
      admin_user_id,
      action,
      details
    ) VALUES (
      OLD.user_id,
      auth.uid(),
      'role_revoked',
      jsonb_build_object(
        'role', OLD.role,
        'revoked_at', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Função enforce_orders_integrity - adicionar search_path
CREATE OR REPLACE FUNCTION public.enforce_orders_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    -- Prevent changing immutable fields
    IF TG_OP = 'UPDATE' THEN
      IF NEW.amount IS DISTINCT FROM OLD.amount THEN
        RAISE EXCEPTION 'Changing amount is not allowed';
      END IF;
      IF NEW.currency IS DISTINCT FROM OLD.currency THEN
        RAISE EXCEPTION 'Changing currency is not allowed';
      END IF;
      IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Changing user_id is not allowed';
      END IF;
      IF NEW.listing_id IS DISTINCT FROM OLD.listing_id THEN
        RAISE EXCEPTION 'Changing listing_id is not allowed';
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only admins can change order status';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Função enforce_listings_moderation - adicionar search_path
CREATE OR REPLACE FUNCTION public.enforce_listings_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Permitir se o usuário for admin
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  
  -- Non-admins cannot approve or highlight
  IF TG_OP = 'INSERT' THEN
    NEW.approved := false;  -- force moderation
    NEW.highlighted := false; -- disallow self highlight
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(NEW.approved, false) <> COALESCE(OLD.approved, false) THEN
      RAISE EXCEPTION 'Only admins can change approval status';
    END IF;
    IF COALESCE(NEW.highlighted, false) <> COALESCE(OLD.highlighted, false) THEN
      RAISE EXCEPTION 'Only admins can change highlight status';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;