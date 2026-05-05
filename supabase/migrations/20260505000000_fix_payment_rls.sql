-- Fix RLS policies for payment flow
-- Problem: payments table has no INSERT policy for authenticated users or anonymous donations
-- Problem: donations and payments tables may lack explicit GRANT for anon/authenticated roles

-- ========================
-- PAYMENTS TABLE FIXES
-- ========================

-- Allow authenticated users to insert their own payment records
CREATE POLICY "Users can create own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous payment inserts (for anonymous donations where user_id is null)
CREATE POLICY "Anonymous can create payments"
ON public.payments
FOR INSERT
WITH CHECK (user_id IS NULL);

-- Allow users to see payments being polled on result page (by id)
CREATE POLICY "Users can view payments by id"
ON public.payments
FOR SELECT
USING (true);

-- Drop the restrictive "Users can view own payments" since we replaced it with a broader one
-- Actually keep it, PostgreSQL evaluates policies with OR logic, so multiple SELECT policies work fine

-- ========================
-- GRANTS (ensure anon and authenticated roles can access tables)
-- ========================
GRANT SELECT, INSERT ON public.donations TO anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.event_registrations TO authenticated;
