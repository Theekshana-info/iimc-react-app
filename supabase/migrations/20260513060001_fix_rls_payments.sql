-- CRITICAL-3: Fix payments SELECT USING(true) exposing all payment records
-- HIGH-8: Revoke UPDATE on payments from anon role

-- ═══════════════════════════════════════
-- Drop the overly permissive SELECT policy
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view payments by id" ON public.payments;

-- Scoped policy: users see own payments, or anonymous completed payments (for donation result polling)
CREATE POLICY "Users can poll own payment result"
ON public.payments FOR SELECT
USING (
  auth.uid() = user_id
  OR (user_id IS NULL AND status = 'completed')
);

-- ═══════════════════════════════════════
-- Revoke dangerous anon UPDATE privilege
-- ═══════════════════════════════════════
REVOKE UPDATE ON public.payments FROM anon;
