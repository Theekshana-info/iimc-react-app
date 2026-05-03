-- Fix gallery_images RLS policies to use correct admin check
DROP POLICY IF EXISTS "Admins can insert gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can update gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON public.gallery_images;

-- Create correct policies using is_admin() function
CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete gallery images"
ON public.gallery_images
FOR DELETE
TO authenticated
USING (is_admin());