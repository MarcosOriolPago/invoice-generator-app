-- Add payment status and paid_at to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;