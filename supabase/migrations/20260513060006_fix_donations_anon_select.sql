-- MEDIUM-3: Revoke SELECT on donations from anon
-- Anonymous users should be able to INSERT donations but not read all donation records.

REVOKE SELECT ON public.donations FROM anon;
-- INSERT for anon is kept since anonymous donations must work
