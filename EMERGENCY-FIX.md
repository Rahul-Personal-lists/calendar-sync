# 🚨 EMERGENCY FIX: Database Tables Missing

## The Problem
Your app is getting `column "start" does not exist` because the database tables haven't been created.

## 🎯 IMMEDIATE SOLUTION

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Click on your project: `fefzkbzqdjywqiqtekgj`
3. In the left sidebar, click **SQL Editor**

### Step 2: Run the Minimal Setup
1. Copy **ALL** the content from `minimal-setup.sql`
2. Paste it into the SQL Editor
3. Click the **Run** button (blue button)
4. You should see "Success" message

### Step 3: Verify Tables Created
1. Copy the content from `test-tables.sql`
2. Paste and run it
3. You should see 4 tables with row counts (all 0 initially)

## ✅ Expected Results
After running the SQL:
- Your app will stop showing the "column start does not exist" error
- The API will be able to fetch events
- You can create new events

## 🔧 If You Still Get Errors
1. **Make sure you copied the ENTIRE SQL content**
2. **Check that you clicked "Run" and got "Success"**
3. **Run the test script to confirm tables exist**
4. **Restart your Next.js server**: `npm run dev`

## 📋 What This Creates
- `events` table with `start` and `"end"` columns
- `users` table for user accounts
- `connected_accounts` for OAuth connections
- `sync_logs` for tracking sync operations
- Basic indexes for performance

## 🚨 IMPORTANT
- The `"end"` column is quoted because `end` is a PostgreSQL reserved keyword
- This is a minimal setup - you can add RLS policies later
- The tables will be empty initially, which is normal

**Run the SQL now and your app will work!** 