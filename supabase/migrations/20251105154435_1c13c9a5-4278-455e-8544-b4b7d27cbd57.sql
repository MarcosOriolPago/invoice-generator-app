-- Add irpf_rate column to user_invoice_configs
ALTER TABLE public.user_invoice_configs 
ADD COLUMN irpf_rate numeric DEFAULT 15 CHECK (irpf_rate >= 0 AND irpf_rate <= 100);