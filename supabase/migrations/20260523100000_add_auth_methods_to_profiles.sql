-- Add auth tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_password boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auth_methods text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Enhanced trigger: sets has_password + auth_methods based on provider
-- Also populates avatar_url from Google OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider text;
BEGIN
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, has_password, auth_methods)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    provider = 'email',
    ARRAY[provider]
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users who don't have auth_methods set
UPDATE public.profiles p
SET
  has_password = CASE WHEN COALESCE(u.raw_app_meta_data->>'provider', 'email') = 'email' THEN true ELSE false END,
  auth_methods = ARRAY[COALESCE(u.raw_app_meta_data->>'provider', 'email')]
FROM auth.users u
WHERE p.id = u.id AND (p.auth_methods IS NULL OR p.auth_methods = '{}');
