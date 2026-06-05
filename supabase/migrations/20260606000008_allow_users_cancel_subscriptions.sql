-- ============================================================
-- Phase 1, Migration 8: Allow users to cancel their own subscriptions
-- Adds an RLS policy for the UPDATE operation on the subscriptions table.
-- ============================================================

CREATE POLICY "Users can cancel own subscriptions" ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
