-- Adicionar campos para imagens customizáveis no site
ALTER TABLE site_settings 
ADD COLUMN hero_image_url text,
ADD COLUMN favicon_url text,
ADD COLUMN og_image_url text;