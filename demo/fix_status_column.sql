-- Fix missing status column in products table
-- Run this script in your PostgreSQL database

-- First, add the column as nullable
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(30);

-- Update existing rows to have IN_STOCK as default
UPDATE products SET status = 'IN_STOCK' WHERE status IS NULL;

-- Now make it NOT NULL (optional, but recommended)
-- ALTER TABLE products ALTER COLUMN status SET NOT NULL;
-- ALTER TABLE products ADD CONSTRAINT check_status CHECK (status IN ('IN_STOCK', 'OUT_OF_STOCK', 'SOLD'));

