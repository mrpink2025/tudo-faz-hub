-- Update the official logo in site settings
UPDATE site_settings 
SET logo_url = '/lovable-uploads/3363485f-af96-418f-833c-79cf164cf51f.png'
WHERE id = 1;

-- Also update the public site settings table if it exists
UPDATE site_settings_public 
SET logo_url = '/lovable-uploads/3363485f-af96-418f-833c-79cf164cf51f.png'
WHERE id = 1;