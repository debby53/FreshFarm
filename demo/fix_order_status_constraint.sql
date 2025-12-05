-- Fix order status constraint to allow all valid statuses
-- Run this script in your PostgreSQL database

-- Drop the existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all valid statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'TRANSFER', 'DELIVERED', 'CANCELLED'));

-- Verify existing orders have valid statuses (update any invalid ones)
UPDATE orders SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'TRANSFER', 'DELIVERED', 'CANCELLED');

