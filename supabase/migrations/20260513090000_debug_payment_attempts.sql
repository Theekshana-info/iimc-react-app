CREATE OR REPLACE FUNCTION public.get_debug_payment_attempts()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  user_id uuid,
  type text,
  status text,
  failure_reason text,
  payhere_order_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.created_at,
    pa.user_id,
    pa.type,
    pa.status,
    pa.failure_reason,
    pa.payhere_order_id
  FROM public.payment_attempts pa
  ORDER BY pa.created_at DESC
  LIMIT 5;
END;
$$;
