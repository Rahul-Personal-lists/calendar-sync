-- Fix events table by adding missing columns
-- This will add columns if they don't exist, or do nothing if they do exist

-- Add start column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'start') THEN
        ALTER TABLE events ADD COLUMN start TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add end column if it doesn't exist (quoted because it's a reserved keyword)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'end') THEN
        ALTER TABLE events ADD COLUMN "end" TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add other missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'title') THEN
        ALTER TABLE events ADD COLUMN title TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'description') THEN
        ALTER TABLE events ADD COLUMN description TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'user_id') THEN
        ALTER TABLE events ADD COLUMN user_id TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'provider') THEN
        ALTER TABLE events ADD COLUMN provider TEXT;
    END IF;
END $$;

-- Make required columns NOT NULL after adding them
ALTER TABLE events ALTER COLUMN start SET NOT NULL;
ALTER TABLE events ALTER COLUMN "end" SET NOT NULL;
ALTER TABLE events ALTER COLUMN title SET NOT NULL;
ALTER TABLE events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN provider SET NOT NULL;

-- Show the final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position; 