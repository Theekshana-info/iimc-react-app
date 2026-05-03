-- Create bank_details table for admin to manage payment information
CREATE TABLE public.bank_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- Everyone can view active bank details
CREATE POLICY "Everyone can view active bank details"
ON public.bank_details
FOR SELECT
USING (is_active = true);

-- Admins can manage bank details
CREATE POLICY "Admins can manage bank details"
ON public.bank_details
FOR ALL
USING (is_admin());

-- Create donations table to store donor information
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  donor_name TEXT,
  donor_message TEXT,
  donor_email TEXT,
  payment_id UUID REFERENCES public.payments(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Anyone can create donations
CREATE POLICY "Anyone can create donations"
ON public.donations
FOR INSERT
WITH CHECK (true);

-- Admins can view all donations
CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
USING (is_admin());

-- Admins can update donations
CREATE POLICY "Admins can update donations"
ON public.donations
FOR UPDATE
USING (is_admin());