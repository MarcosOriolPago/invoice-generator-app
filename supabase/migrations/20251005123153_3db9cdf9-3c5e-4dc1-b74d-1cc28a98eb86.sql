-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
ON public.invoices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON public.invoices
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON public.invoices
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create invoice_spaces table for organizing invoices
CREATE TABLE IF NOT EXISTS public.invoice_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_spaces
ALTER TABLE public.invoice_spaces ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_spaces
CREATE POLICY "Users can view their own spaces"
ON public.invoice_spaces
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spaces"
ON public.invoice_spaces
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
ON public.invoice_spaces
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
ON public.invoice_spaces
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on invoice_spaces
CREATE TRIGGER update_invoice_spaces_updated_at
BEFORE UPDATE ON public.invoice_spaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add space_id column to invoices table (nullable for unorganized invoices)
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.invoice_spaces(id) ON DELETE SET NULL;