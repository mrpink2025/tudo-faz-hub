-- Fix critical security vulnerability: Add RLS policies for user_roles table
-- This prevents users from granting themselves admin privileges

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users cannot insert admin roles for themselves" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

-- Create comprehensive RLS policies for user_roles table
CREATE POLICY "Only admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Add audit logging function for role changes (security monitoring)
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS log_role_changes ON public.user_roles;
CREATE TRIGGER log_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();