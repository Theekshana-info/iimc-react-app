-- ============================================================
-- Phase 1, Migration 5: subscription_attempts
-- Logs recurring billing transactions from gateway webhooks.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_attempts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid        NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount          numeric     NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  gateway_tx_id   text        NULL,
  failure_reason  text        NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for subscription lookup
CREATE INDEX IF NOT EXISTS idx_sub_attempts_subscription
  ON public.subscription_attempts(subscription_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.subscription_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription attempts
CREATE POLICY "Users can view own subscription attempts"
  ON public.subscription_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_attempts.subscription_id
        AND s.user_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all subscription attempts"
  ON public.subscription_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

GRANT ALL ON public.subscription_attempts TO service_role;
GRANT SELECT ON public.subscription_attempts TO authenticated;
