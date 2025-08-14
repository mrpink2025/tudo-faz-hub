-- Create auth audit log for monitoring login attempts
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on auth audit log
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth audit logs
CREATE POLICY "Admins can view auth audit logs" 
ON public.auth_audit_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to log auth events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.auth_audit_log (
    user_id,
    event_type,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_event_type,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  );
END;
$$;