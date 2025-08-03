-- Step 1: Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create connected_accounts table
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'notion')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create events table (with quoted "end" column)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'notion', 'apple')),
  title TEXT NOT NULL,
  description TEXT,
  start TIMESTAMP WITH TIME ZONE NOT NULL,
  "end" TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notion_page_id TEXT,
  google_event_id TEXT,
  outlook_event_id TEXT,
  apple_event_id TEXT,
  color TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'notion')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  events_synced INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
CREATE INDEX IF NOT EXISTS idx_events_provider ON events(provider);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);

-- Step 6: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (email = current_user);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (email = current_user);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (email = current_user);

CREATE POLICY "Users can view own connected accounts" ON connected_accounts
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert own connected accounts" ON connected_accounts
  FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update own connected accounts" ON connected_accounts
  FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (user_id = current_user);

CREATE POLICY "Users can view own sync logs" ON sync_logs
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert own sync logs" ON sync_logs
  FOR INSERT WITH CHECK (user_id = current_user); 