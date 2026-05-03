-- Create home_messages table for admin-managed messages on home page
CREATE TABLE public.home_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  is_visible BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can view visible, active messages
CREATE POLICY "Everyone can view active messages"
ON public.home_messages
FOR SELECT
USING (
  is_visible = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

-- Admins can manage all messages
CREATE POLICY "Admins can manage messages"
ON public.home_messages
FOR ALL
USING (is_admin());

-- Create social_links table for footer social media links
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Everyone can view active social links
CREATE POLICY "Everyone can view social links"
ON public.social_links
FOR SELECT
USING (is_active = true);

-- Admins can manage social links
CREATE POLICY "Admins can manage social links"
ON public.social_links
FOR ALL
USING (is_admin());

-- Insert default social links
INSERT INTO public.social_links (platform, url, icon_name, display_order) VALUES
('Facebook', 'https://facebook.com', 'facebook', 1),
('YouTube', 'https://youtube.com', 'youtube', 2),
('Instagram', 'https://instagram.com', 'instagram', 3);