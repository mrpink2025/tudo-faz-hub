-- Criar função para sincronizar site_settings com site_settings_public
CREATE OR REPLACE FUNCTION sync_site_settings_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Deletar dados existentes se houver
  DELETE FROM site_settings_public;
  
  -- Inserir dados atualizados
  INSERT INTO site_settings_public (
    site_name, logo_url, brand_primary, brand_accent, 
    promo_html, hero_image_url, favicon_url, og_image_url
  )
  SELECT 
    site_name, logo_url, brand_primary, brand_accent,
    promo_html, hero_image_url, favicon_url, og_image_url
  FROM site_settings
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar automaticamente
CREATE TRIGGER sync_public_settings
  AFTER INSERT OR UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION sync_site_settings_public();

-- Sincronizar dados atuais
DELETE FROM site_settings_public;
INSERT INTO site_settings_public (
  site_name, logo_url, brand_primary, brand_accent, 
  promo_html, hero_image_url, favicon_url, og_image_url
)
SELECT 
  site_name, logo_url, brand_primary, brand_accent,
  promo_html, hero_image_url, favicon_url, og_image_url
FROM site_settings
WHERE id = 1;