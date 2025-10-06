-- Add missing columns to invoice_spaces table
-- Run this in your Supabase SQL Editor

-- Add the description column
ALTER TABLE public.invoice_spaces 
ADD COLUMN description TEXT;

-- Add the updated_at column
ALTER TABLE public.invoice_spaces 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or replace the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_invoice_spaces_updated_at ON public.invoice_spaces;
CREATE TRIGGER update_invoice_spaces_updated_at
BEFORE UPDATE ON public.invoice_spaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing rows to have the current timestamp for updated_at
UPDATE public.invoice_spaces 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoice_spaces' AND table_schema = 'public'
ORDER BY ordinal_position;