-- HIGH-6: Make admin-uploads bucket private
-- Previously public=true, meaning anyone with the URL could access files.

UPDATE storage.buckets SET public = false WHERE id = 'admin-uploads';
