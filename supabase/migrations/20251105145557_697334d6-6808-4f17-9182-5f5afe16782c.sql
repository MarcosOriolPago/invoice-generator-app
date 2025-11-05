-- Add tax_rate column to user_invoice_configs
ALTER TABLE public.user_invoice_configs 
ADD COLUMN tax_rate numeric DEFAULT 21 CHECK (tax_rate >= 0 AND tax_rate <= 100);