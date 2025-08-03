# Database Setup Guide

## Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Create a new query

## Step 2: Run the Database Schema

Copy and paste this SQL into the Supabase SQL Editor:

```sql
-- Calendar Sync App Database Schema
-- Run this in your Supabase SQL Editor

```

## Step 3: Verify Tables Created

After running the SQL, you should see these tables in your Supabase dashboard:

1. **users** - Stores user information
2. **connected_accounts** - Stores OAuth tokens for each provider
3. **events** - Stores synced calendar events
4. **sync_logs** - Stores sync operation logs

## Step 4: Test the Setup

Once the tables are created, you can test the connection:

1. Go to your app: `http://localhost:3000/settings`
2. Try connecting a calendar provider
3. Check the browser console for any errors
4. Verify in Supabase that the `connected_accounts` table gets populated

## Troubleshooting

### If you get permission errors:
- Make sure you're using the correct Supabase project
- Check that your environment variables are correct
- Verify the service role key has proper permissions

### If tables don't appear:
- Refresh the Supabase dashboard
- Check the SQL Editor for any error messages
- Make sure you're in the correct schema (public)

### If RLS policies fail:
- The policies use `current_user` which should work with Supabase auth
- You might need to adjust the policies based on your auth setup

## Next Steps

After setting up the database:

1. **Test Calendar Connection**: Try connecting Google Calendar first
2. **Verify Multiple Connections**: Connect Outlook Calendar as well
3. **Check Data**: Look in the `connected_accounts` table to see your connections
4. **Test Sync**: Try syncing events from your connected calendars

The app should now properly support multiple calendar connections! 🎉 