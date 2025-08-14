-- Criar bucket assets se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para bucket assets
CREATE POLICY "Public can view assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assets');

CREATE POLICY "Admins can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assets' AND has_role(auth.uid(), 'admin'::app_role));