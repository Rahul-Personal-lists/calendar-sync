-- Verify that all tables were created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'connected_accounts', 'events', 'sync_logs')
ORDER BY table_name, ordinal_position;

-- Check if the events table has the correct columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Test inserting a sample event (this will fail if RLS is working correctly)
-- INSERT INTO events (user_id, provider, title, start, "end") 
-- VALUES ('test@example.com', 'google', 'Test Event', NOW(), NOW() + INTERVAL '1 hour'); 