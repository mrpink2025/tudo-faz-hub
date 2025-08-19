-- Inserir dados iniciais na tabela site_settings se não existirem
INSERT INTO public.site_settings (id, site_name, logo_url)
VALUES (1, 'TudoFaz', '/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png')
ON CONFLICT (id) 
DO UPDATE SET 
  logo_url = EXCLUDED.logo_url,
  updated_at = now();