-- Allow authenticated users to INSERT their own payment attempts
CREATE POLICY "Users can create own payment attempts"
ON public.payment_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own payment attempts (e.g. cancelled/failed)
CREATE POLICY "Users can update own payment attempts"
ON public.payment_attempts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous donations to create payment attempts (user_id is null)
CREATE POLICY "Anonymous can create payment attempts"
ON public.payment_attempts
FOR INSERT
WITH CHECK (user_id IS NULL);

-- Grant INSERT and UPDATE to authenticated users
GRANT INSERT, UPDATE ON public.payment_attempts TO authenticated;
GRANT INSERT ON public.payment_attempts TO anon;
