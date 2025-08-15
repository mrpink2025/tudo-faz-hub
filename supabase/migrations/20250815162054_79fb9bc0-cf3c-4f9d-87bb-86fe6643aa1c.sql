-- Remove the overly permissive policy that allows all authenticated users to view site_settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.site_settings;

-- Create a new policy that only allows admin users to view site_settings
CREATE POLICY "Only admins can view site settings" 
ON public.site_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));