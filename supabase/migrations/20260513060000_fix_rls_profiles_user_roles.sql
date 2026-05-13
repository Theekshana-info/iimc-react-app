-- CRITICAL-4: Fix profiles PII exposure
-- CRITICAL-5: Fix admin role enumeration
-- Previously: SELECT USING (true) allowed anyone to read all profiles and roles

-- ═══════════════════════════════════════
-- PROFILES: Restrict to own profile + admins
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

-- ═══════════════════════════════════════
-- USER_ROLES: Restrict to own role + admins
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin());
