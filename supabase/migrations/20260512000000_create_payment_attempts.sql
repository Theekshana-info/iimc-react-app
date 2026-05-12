-- ============================================================
-- payment_attempts: log every payment attempt for admin audit
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  type text NOT NULL,                       -- 'event_registration' | 'donation'
  event_id uuid REFERENCES public.events(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'LKR',
  status text NOT NULL DEFAULT 'pending',   -- pending, success, failed, cancelled, chargeback
  failure_reason text,                      -- e.g. 'Insufficient Funds', 'Network Error'
  payhere_order_id text,                    -- PayHere order_id / payment_id
  donation_id uuid,                         -- link to donations table if type=donation
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can read all payment attempts
CREATE POLICY "Admins can view all payment attempts"
ON public.payment_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Service role (edge functions) can insert
-- No INSERT policy needed for authenticated users since inserts go through edge functions using service_role

-- Grant access
GRANT SELECT ON public.payment_attempts TO authenticated;
GRANT ALL ON public.payment_attempts TO service_role;
