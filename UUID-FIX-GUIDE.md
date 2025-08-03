# 🔧 Fix UUID User ID Issue

## The Problem
Your database has `user_id` as UUID type, but your application uses email addresses as user IDs. This causes the error:
```
invalid input syntax for type uuid: "rahulpatidar0191@gmail.com"
```

## ✅ Solution

### Step 1: Run the Database Fix
1. Go to your Supabase SQL Editor
2. Copy and paste the content from `fix-user-id.sql`
3. Click **Run**

### Step 2: What This Does
- Changes `user_id` column from UUID to TEXT in all tables
- Removes foreign key constraints that expect UUIDs
- Allows email addresses to be used as user IDs

### Step 3: Verify the Fix
After running the SQL, your application should:
- ✅ Stop showing the UUID error
- ✅ Successfully fetch events using email as user_id
- ✅ Work with your existing authentication system

## 🔧 Database Changes
The script will update these tables:
- `events` - user_id: UUID → TEXT
- `connected_accounts` - user_id: UUID → TEXT  
- `sync_logs` - user_id: UUID → TEXT

## 🎯 Result
Your application uses email addresses for user identification, which is simpler and matches your current authentication flow. The database will now accept email addresses as user IDs.

**Run the `fix-user-id.sql` script and the UUID error will be resolved!** 