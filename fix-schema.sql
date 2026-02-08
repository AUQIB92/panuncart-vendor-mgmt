-- Fix missing columns in vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'business_address';
