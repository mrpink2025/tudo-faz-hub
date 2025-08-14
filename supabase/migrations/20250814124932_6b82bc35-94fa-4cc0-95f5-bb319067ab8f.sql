-- Corrigir a view site_settings_public para usar security_invoker
DROP VIEW IF EXISTS public.site_settings_public;

CREATE VIEW public.site_settings_public 
WITH (security_invoker = true)
AS
SELECT 
    site_name,
    logo_url,
    favicon_url,
    hero_image_url,
    og_image_url,
    brand_primary,
    brand_accent,
    promo_html
FROM public.site_settings
WHERE id = 1;

-- Permitir acesso público à view de configurações não-sensíveis
GRANT SELECT ON public.site_settings_public TO anon, authenticated;