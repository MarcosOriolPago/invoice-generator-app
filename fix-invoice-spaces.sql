-- Fix invoice_spaces table structure
-- Run this in your Supabase SQL Editor

-- First, let's check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'invoice_spaces') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.invoice_spaces (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT DEFAULT '#3b82f6',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Created invoice_spaces table';
    ELSE
        RAISE NOTICE 'invoice_spaces table already exists';
    END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE public.invoice_spaces 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.invoice_spaces 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

ALTER TABLE public.invoice_spaces 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.invoice_spaces 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS
ALTER TABLE public.invoice_spaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own spaces" ON public.invoice_spaces;
DROP POLICY IF EXISTS "Users can create their own spaces" ON public.invoice_spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON public.invoice_spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON public.invoice_spaces;

-- Create RLS policies
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

-- Also ensure the invoices table has the space_id column
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS space_id UUID;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'invoices' 
        AND constraint_name = 'invoices_space_id_fkey'
    ) THEN
        ALTER TABLE public.invoices 
        ADD CONSTRAINT invoices_space_id_fkey 
        FOREIGN KEY (space_id) REFERENCES public.invoice_spaces(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint';
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Setup completed successfully!' as result;