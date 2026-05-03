-- Fix foreign keys to point to profiles instead of auth.users for proper joins

-- Drop and recreate blog_posts author_id foreign key
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop and recreate user_roles user_id foreign key  
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop and recreate event_registrations user_id foreign key
ALTER TABLE public.event_registrations
DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;

ALTER TABLE public.event_registrations
ADD CONSTRAINT event_registrations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop and recreate teachers user_id foreign key
ALTER TABLE public.teachers
DROP CONSTRAINT IF EXISTS teachers_user_id_fkey;

ALTER TABLE public.teachers
ADD CONSTRAINT teachers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop and recreate bookings user_id foreign key
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop and recreate subscriptions user_id foreign key
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop and recreate payments user_id foreign key
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;