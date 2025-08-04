-- Migration: Add repeat field to events table
-- This adds support for recurring events

-- Add repeat column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS repeat JSONB;

-- Add comment to explain the repeat field structure
COMMENT ON COLUMN events.repeat IS 'JSON object containing repeat options: {frequency: "daily|weekly|monthly|yearly", interval: number, endDate: "ISO date", endAfterOccurrences: number, daysOfWeek: [0-6], dayOfMonth: 1-31}';

-- Create index for repeat queries
CREATE INDEX IF NOT EXISTS idx_events_repeat ON events USING GIN (repeat); 