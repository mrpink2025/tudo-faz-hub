-- First ensure there's a row in site_settings
INSERT INTO site_settings (id, logo_url) 
VALUES (1, '/lovable-uploads/3363485f-af96-418f-833c-79cf164cf51f.png')
ON CONFLICT (id) 
DO UPDATE SET 
  logo_url = '/lovable-uploads/3363485f-af96-418f-833c-79cf164cf51f.png',
  updated_at = now();

-- Also update site_settings_public if there's a row
UPDATE site_settings_public 
SET logo_url = '/lovable-uploads/3363485f-af96-418f-833c-79cf164cf51f.png'
WHERE EXISTS (SELECT 1 FROM site_settings_public LIMIT 1);