-- Atualizar favicon_url para usar a nova logo
UPDATE site_settings 
SET favicon_url = '/lovable-uploads/a87f8885-b030-49a0-904c-ef954b5ed0aa.png',
    updated_at = now()
WHERE id = 1;