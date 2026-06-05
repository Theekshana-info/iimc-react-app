-- ============================================================
-- Phase 1, Migration 4: Expand subscriptions table
-- Adds recurring donation support columns.
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS gateway                text        DEFAULT 'payhere',
  ADD COLUMN IF NOT EXISTS gateway_subscription_id text       NULL,
  ADD COLUMN IF NOT EXISTS billing_cycle          text        DEFAULT 'monthly'
                                                              CHECK (billing_cycle IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS amount                 numeric     NULL,
  ADD COLUMN IF NOT EXISTS next_charge_date       timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at           timestamptz NULL,
  ADD COLUMN IF NOT EXISTS retry_count            integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_until            timestamptz NULL,
  ADD COLUMN IF NOT EXISTS donor_message          text        NULL;

-- The existing 'price' column stays for backward compatibility.
-- New subscriptions will use 'amount' as the canonical field.

-- Index for finding subscriptions due for renewal
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_charge
  ON public.subscriptions(next_charge_date)
  WHERE status = 'active';

-- Index for gateway lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_id
  ON public.subscriptions(gateway_subscription_id)
  WHERE gateway_subscription_id IS NOT NULL;
