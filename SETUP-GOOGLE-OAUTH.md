# Setting Up Google OAuth for Delete Functionality

## Issue
The delete functionality is failing with a 401 Unauthorized error because the Google OAuth credentials are not properly configured.

## Solution

### 1. Create Environment File
Create a `.env.local` file in the project root:

```bash
cp env.example .env.local
```

### 2. Get Google OAuth Credentials

#### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

#### Step 2: Enable Google Calendar API
1. Go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

#### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google` (if using port 3001)
5. Click "Create"
6. Copy the Client ID and Client Secret

#### Step 4: Update .env.local
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Test the Setup

1. Restart the development server:
   ```bash
   npm run dev
   ```

2. Sign in with Google in your app

3. Try to delete an event

4. Check the console logs for debugging information

## Debugging

### Check Token Status
Visit `/api/debug-tokens` (while signed in) to see:
- Connected accounts
- Token status for each provider
- Token refresh attempts

### Common Issues

1. **401 Unauthorized**: Usually means OAuth credentials are missing or incorrect
2. **Token expired**: The app should automatically refresh tokens
3. **No refresh token**: User needs to re-authenticate with Google

### Environment Variables Checklist
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set
- [ ] `NEXTAUTH_SECRET` is set (can be any random string)
- [ ] Supabase credentials are configured

## Testing Delete Functionality

1. **Sync events first**: Use the "Sync Now" button to fetch events
2. **Select a date**: Click on a date with events
3. **Hover over event**: The delete button (×) should appear
4. **Click delete**: Confirm the deletion
5. **Check result**: Event should be removed from both provider and database

## Troubleshooting

### If delete still fails:
1. Check browser console for errors
2. Check server logs for detailed error messages
3. Verify Google Calendar API is enabled
4. Ensure the OAuth consent screen is configured
5. Check that the redirect URIs match exactly

### Token Refresh Issues:
- The app automatically refreshes expired tokens
- If refresh fails, user needs to re-authenticate
- Check the `/api/debug-tokens` endpoint for token status 