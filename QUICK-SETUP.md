# 🚀 Quick Database Setup

## The Problem
Your application is getting this error:
```
column "start" does not exist
```

This means the database tables haven't been created yet.

## ✅ Solution (3 Steps)

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: `fefzkbzqdjywqiqtekgj`
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the SQL Schema
1. Copy **ALL** the content from `create-tables-step-by-step.sql`
2. Paste it into the SQL Editor
3. Click **Run** button

### Step 3: Verify Tables Created
1. Run the content from `verify-tables.sql` to check if tables exist
2. You should see 4 tables: `users`, `connected_accounts`, `events`, `sync_logs`

## 🎯 Expected Result
After running the SQL, your application will:
- ✅ Stop showing the "column start does not exist" error
- ✅ Be able to fetch events from the database
- ✅ Allow creating new events
- ✅ Work with authentication

## 🔧 If You Still Get Errors
1. Make sure you copied the **entire** SQL content
2. Check that the SQL executed without errors
3. Run the verification script to confirm tables exist
4. Restart your Next.js development server

## 📋 What Gets Created
- **users** - User accounts and profiles
- **connected_accounts** - OAuth provider connections
- **events** - Calendar events (with `start` and `"end"` columns)
- **sync_logs** - Sync operation history
- **Indexes** - For better performance
- **RLS Policies** - For data security

The `"end"` column is quoted because `end` is a PostgreSQL reserved keyword. 