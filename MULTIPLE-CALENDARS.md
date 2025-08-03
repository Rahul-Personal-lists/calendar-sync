# Multiple Calendar Connections

## Overview

The Calendar Sync app now supports connecting **multiple calendar accounts simultaneously**. You can connect Google Calendar, Outlook Calendar, and Notion Calendar all at the same time and sync events across all platforms.

## How It Works

### Database Structure
- Each user can have multiple entries in the `connected_accounts` table
- Each connection is uniquely identified by `user_id` + `provider`
- Tokens are stored securely and updated when refreshed

### Connection Flow
1. **Connect First Calendar**: Click "Connect" on any calendar provider
2. **Authorize**: Complete OAuth flow for that provider
3. **Connect Additional Calendars**: Repeat for other providers
4. **All Connected**: See all calendars in the dashboard

### Visual Indicators
- **Connection Counter**: Shows how many calendars are connected
- **Status Indicators**: Green dot for connected, loading states during connection
- **Provider Cards**: Each calendar shows its connection status

## Supported Providers

| Provider | Display Name | Icon | Color |
|----------|-------------|------|-------|
| Google | Google Calendar | G | #4285f4 |
| Outlook | Outlook Calendar | O | #0078d4 |
| Notion | Notion Calendar | N | #000000 |

## Features

### ✅ What Works
- Connect multiple calendars simultaneously
- Disconnect individual calendars
- Visual connection status
- Loading states during connection/disconnection
- Secure token storage per connection

### 🔄 Sync Behavior
- Events from all connected calendars appear in unified view
- Each event shows its source provider
- Real-time sync across all connected accounts

### 🛡️ Security
- Each connection stores its own tokens
- Tokens are encrypted in database
- Individual disconnect capability
- Session-based authentication

## Troubleshooting

### Can't Connect Multiple Calendars?
1. **Check Database**: Ensure `connected_accounts` table exists
2. **Clear Browser Data**: Try incognito mode
3. **Check Permissions**: Ensure OAuth scopes are correct
4. **Review Logs**: Check browser console for errors

### Connection Issues?
- **Google**: Requires Calendar API access
- **Outlook**: Requires Calendars.ReadWrite scope
- **Notion**: Not yet implemented (coming soon)

## Technical Details

### Database Schema
```sql
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### API Endpoints
- `GET /api/providers` - List connected accounts
- `DELETE /api/providers/[provider]` - Disconnect specific provider

### NextAuth Configuration
- Supports multiple OAuth providers
- Stores tokens per connection
- Handles token refresh automatically

## Future Enhancements

- [ ] Notion calendar integration
- [ ] Apple Calendar support
- [ ] Calendar-specific sync settings
- [ ] Conflict resolution between calendars
- [ ] Calendar color customization 