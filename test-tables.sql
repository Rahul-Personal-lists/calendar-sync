-- Test if tables exist
SELECT 'events' as table_name, COUNT(*) as row_count FROM events
UNION ALL
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'connected_accounts' as table_name, COUNT(*) as row_count FROM connected_accounts
UNION ALL
SELECT 'sync_logs' as table_name, COUNT(*) as row_count FROM sync_logs;

-- Show events table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position; 