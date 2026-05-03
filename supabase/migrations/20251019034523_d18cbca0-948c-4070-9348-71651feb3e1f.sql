-- Update site settings with IIMC branding
UPDATE site_settings 
SET value = 'Isipathana International Meditation Center'
WHERE key = 'hero_title';

UPDATE site_settings 
SET value = 'Join us on a journey of mindfulness and self-discovery'
WHERE key = 'hero_subtitle';

-- Insert default hero settings if they don't exist
INSERT INTO site_settings (key, value, description)
VALUES 
  ('hero_title', 'Isipathana International Meditation Center', 'Main hero title')
ON CONFLICT (key) DO UPDATE 
SET value = 'Isipathana International Meditation Center';

INSERT INTO site_settings (key, value, description)
VALUES 
  ('hero_subtitle', 'Join us on a journey of mindfulness and self-discovery', 'Hero subtitle text')
ON CONFLICT (key) DO UPDATE 
SET value = 'Join us on a journey of mindfulness and self-discovery';