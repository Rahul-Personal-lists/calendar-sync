-- =====================================================
-- Calendar Sync App - Complete Database Schema
-- =====================================================
-- This file contains the complete database schema for the calendar sync application
-- Generated from current database state on $(date)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connected accounts for OAuth providers
CREATE TABLE IF NOT EXISTS connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- Unified events from all providers
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    provider TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    notion_page_id TEXT,
    google_event_id TEXT,
    outlook_event_id TEXT,
    apple_event_id TEXT,
    color TEXT,
    is_all_day BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, google_event_id),
    UNIQUE(user_id, outlook_event_id),
    UNIQUE(user_id, notion_page_id)
);

-- Sync operation logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    events_synced INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User color preferences for providers
CREATE TABLE IF NOT EXISTS user_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Connected accounts indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_provider ON events(provider);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- Sync logs indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);

-- User colors indexes
CREATE INDEX IF NOT EXISTS idx_user_colors_user_id ON user_colors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_colors_provider ON user_colors(provider);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on user_colors table
ALTER TABLE user_colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_colors
CREATE POLICY "Users can view their own color preferences" ON user_colors
    FOR SELECT USING (user_id = CURRENT_USER);

CREATE POLICY "Users can insert their own color preferences" ON user_colors
    FOR INSERT WITH CHECK (user_id = CURRENT_USER);

CREATE POLICY "Users can update their own color preferences" ON user_colors
    FOR UPDATE USING (user_id = CURRENT_USER);

CREATE POLICY "Users can delete their own color preferences" ON user_colors
    FOR DELETE USING (user_id = CURRENT_USER);

-- Note: Other tables have RLS policies but RLS is not enabled
-- This is intentional for the current setup

-- =====================================================
-- TRIGGERS (if any)
-- =====================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_connected_accounts_updated_at 
    BEFORE UPDATE ON connected_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_colors_updated_at 
    BEFORE UPDATE ON user_colors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'User accounts for the calendar sync application';
COMMENT ON TABLE connected_accounts IS 'OAuth connections to calendar providers (Google, Outlook, Notion, etc.)';
COMMENT ON TABLE events IS 'Unified events from all connected calendar providers';
COMMENT ON TABLE sync_logs IS 'Logs of sync operations for debugging and monitoring';
COMMENT ON TABLE user_colors IS 'User preferences for calendar colors per provider';

COMMENT ON COLUMN events.provider IS 'Calendar provider: google, outlook, notion, apple';
COMMENT ON COLUMN events.notion_page_id IS 'Notion page ID for linking events to Notion pages';
COMMENT ON COLUMN events.google_event_id IS 'Google Calendar event ID for deduplication';
COMMENT ON COLUMN events.outlook_event_id IS 'Outlook Calendar event ID for deduplication';
COMMENT ON COLUMN events.apple_event_id IS 'Apple Calendar event ID for deduplication';

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Uncomment to add sample data for testing
/*
INSERT INTO users (email, name) VALUES 
    ('test@example.com', 'Test User');

INSERT INTO user_colors (user_id, provider, color) VALUES 
    ('test@example.com', 'google', '#4285F4'),
    ('test@example.com', 'outlook', '#0078D4'),
    ('test@example.com', 'notion', '#000000');
*/ 