
-- Create a public storage bucket for admin uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-uploads', 'admin-uploads', true);

-- Everyone can view uploaded files
CREATE POLICY "Public read access for admin uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-uploads');

-- Only admins can upload files
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admin-uploads' AND public.is_admin());

-- Only admins can update files
CREATE POLICY "Admins can update uploaded files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'admin-uploads' AND public.is_admin());

-- Only admins can delete files
CREATE POLICY "Admins can delete uploaded files"
ON storage.objects FOR DELETE
USING (bucket_id = 'admin-uploads' AND public.is_admin());
