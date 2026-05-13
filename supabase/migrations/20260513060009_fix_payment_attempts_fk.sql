-- Fix payment_attempts foreign key to allow event deletion
ALTER TABLE public.payment_attempts
DROP CONSTRAINT IF EXISTS payment_attempts_event_id_fkey;

ALTER TABLE public.payment_attempts
ADD CONSTRAINT payment_attempts_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE SET NULL;
