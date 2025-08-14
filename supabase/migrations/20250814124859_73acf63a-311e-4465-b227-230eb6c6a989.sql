-- Criar uma view pública específica para configurações não-sensíveis que precisam ser acessadas por usuários anônimos
CREATE VIEW public.site_settings_public AS
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

-- Manter a política restritiva na tabela principal para proteger dados sensíveis como stripe_publishable_key