-- Fix user_id column type to match application expectations
-- The application uses email as user_id, but the database expects UUID

-- First, let's check the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'user_id';

-- Remove the foreign key constraint FIRST (before changing column type)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
ALTER TABLE connected_accounts DROP CONSTRAINT IF EXISTS connected_accounts_user_id_fkey;
ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_user_id_fkey;

-- Now update user_id column to TEXT type to accept email addresses
ALTER TABLE events ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE connected_accounts ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE sync_logs ALTER COLUMN user_id TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('events', 'connected_accounts', 'sync_logs') 
AND column_name = 'user_id'
ORDER BY table_name; 