-- Remove contact details from site_settings table as they are now hardcoded in the frontend
DELETE FROM public.site_settings 
WHERE key IN ('contact_phone', 'contact_email');
