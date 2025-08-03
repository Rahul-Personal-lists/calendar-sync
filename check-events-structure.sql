-- Check the actual structure of the events table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Try to describe the table structure
\d events;

-- Check if the table has any data
SELECT COUNT(*) as total_events FROM events;

-- Try to select from events to see what columns exist
SELECT * FROM events LIMIT 1; 