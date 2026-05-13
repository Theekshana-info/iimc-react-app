-- HIGH-3: Add UNIQUE constraint on payments.transaction_id
-- Prevents duplicate payment records from webhook replay attacks.
-- PayHere retries webhook delivery; without this, each retry creates a new row.

-- First remove any existing duplicates (keep the first one)
DELETE FROM public.payments a
USING public.payments b
WHERE a.id > b.id
  AND a.transaction_id = b.transaction_id
  AND a.transaction_id IS NOT NULL;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_transaction_id_unique UNIQUE (transaction_id);
