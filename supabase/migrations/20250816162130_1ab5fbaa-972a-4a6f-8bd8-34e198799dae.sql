-- Phase 1: Critical Security Fixes

-- 1. Secure all database functions by adding proper search_path
-- This prevents function hijacking attacks

CREATE OR REPLACE FUNCTION public.handle_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    email = new.email,
    email_confirmed_at = new.email_confirmed_at,
    last_sign_in_at = new.last_sign_in_at,
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.detect_affiliate_fraud(p_affiliate_link_id uuid, p_visitor_ip inet, p_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  fraud_score integer := 0;
  fraud_reasons text[] := '{}';
  click_count integer;
  recent_clicks integer;
  suspicious_pattern boolean;
BEGIN
  -- Check for excessive clicks from same IP
  SELECT COUNT(*) INTO click_count
  FROM affiliate_clicks 
  WHERE visitor_ip = p_visitor_ip 
  AND affiliate_link_id = p_affiliate_link_id;
  
  IF click_count > 10 THEN
    fraud_score := fraud_score + 50;
    fraud_reasons := array_append(fraud_reasons, 'Excessive clicks from same IP');
  END IF;
  
  -- Check for rapid clicking patterns (more than 5 clicks in 1 hour)
  SELECT COUNT(*) INTO recent_clicks
  FROM affiliate_clicks 
  WHERE visitor_ip = p_visitor_ip 
  AND affiliate_link_id = p_affiliate_link_id
  AND clicked_at > NOW() - INTERVAL '1 hour';
  
  IF recent_clicks > 5 THEN
    fraud_score := fraud_score + 30;
    fraud_reasons := array_append(fraud_reasons, 'Rapid clicking pattern detected');
  END IF;
  
  -- Check for suspicious user agent patterns
  IF p_user_agent IS NULL OR 
     p_user_agent ILIKE '%bot%' OR 
     p_user_agent ILIKE '%crawler%' OR 
     p_user_agent ILIKE '%spider%' THEN
    fraud_score := fraud_score + 25;
    fraud_reasons := array_append(fraud_reasons, 'Suspicious user agent');
  END IF;
  
  -- Check for clicks outside business hours repeatedly (potential automation)
  SELECT EXISTS(
    SELECT 1 FROM affiliate_clicks 
    WHERE visitor_ip = p_visitor_ip 
    AND affiliate_link_id = p_affiliate_link_id
    AND EXTRACT(hour FROM clicked_at) NOT BETWEEN 8 AND 22
    GROUP BY date_trunc('day', clicked_at)
    HAVING COUNT(*) > 10
  ) INTO suspicious_pattern;
  
  IF suspicious_pattern THEN
    fraud_score := fraud_score + 20;
    fraud_reasons := array_append(fraud_reasons, 'Suspicious timing patterns');
  END IF;
  
  RETURN jsonb_build_object(
    'fraud_score', fraud_score,
    'is_suspicious', fraud_score >= 50,
    'is_fraudulent', fraud_score >= 75,
    'reasons', fraud_reasons
  );
END;
$function$;

-- 2. Add audit logging for admin role changes
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  admin_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view security audit logs" ON public.security_audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- 3. Create enhanced role change auditing function
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

-- Add trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes ON public.user_roles;
CREATE TRIGGER audit_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- 4. Strengthen user_roles RLS policies
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND auth.uid() != user_id -- Prevent self-role modification
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND auth.uid() != user_id -- Prevent self-role modification
  );