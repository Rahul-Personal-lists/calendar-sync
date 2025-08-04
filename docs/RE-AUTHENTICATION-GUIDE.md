# Google Re-Authentication Issue - Diagnosis & Fix

## The Problem
You're having to log into Google every few hours, which indicates that refresh tokens are not being properly requested or stored.

## Root Causes & Solutions

### 1. Google OAuth App Configuration

**Check your Google Cloud Console settings:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID
5. **Critical**: Make sure "Access type" is set to "Offline"

**If it's not set to "Offline":**
- Edit your OAuth client
- Set "Access type" to "Offline"
- Save changes
- **You'll need to re-authenticate after this change**

### 2. NextAuth Configuration (Fixed)

I've updated your NextAuth configuration to properly request refresh tokens:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',  // ← This was missing
      prompt: 'consent',       // ← This ensures refresh tokens
    },
  },
}),
```

### 3. Testing Your Current Setup

Use these endpoints to diagnose the issue:

#### Check Token Status
```bash
curl http://localhost:3000/api/debug-tokens
```

#### Test Token Refresh
```bash
curl -X POST http://localhost:3000/api/test-token-refresh \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```

### 4. Expected Behavior

**With proper refresh tokens:**
- Access tokens expire after 1 hour
- Refresh tokens last much longer (can be revoked by user)
- App automatically refreshes access tokens using refresh tokens
- User stays logged in for weeks/months

**Without refresh tokens:**
- Access tokens expire after 1 hour
- No way to get new access tokens without re-authentication
- User must log in every hour

### 5. Debugging Steps

1. **Check if you have refresh tokens:**
   ```bash
   curl http://localhost:3000/api/debug-tokens
   ```
   Look for `hasRefreshToken: true` in the response.

2. **If no refresh tokens:**
   - Check Google Cloud Console settings (step 1)
   - Re-authenticate with Google after fixing settings
   - The `prompt: 'consent'` parameter forces Google to show the consent screen and provide refresh tokens

3. **If you have refresh tokens but still having issues:**
   - Test the refresh functionality
   - Check the logs for token refresh errors

### 6. Re-Authentication Process

After fixing the configuration:

1. **Sign out** of your app completely
2. **Clear browser cookies** for your domain
3. **Sign in again** with Google
4. **Check the debug endpoint** to confirm refresh tokens are stored

### 7. Google OAuth Best Practices

- **Access type**: Always use "offline" for web apps
- **Prompt**: Use "consent" for first-time users to ensure refresh tokens
- **Scopes**: Only request the scopes you actually need
- **Token storage**: Store refresh tokens securely (you're doing this correctly)

### 8. Monitoring

Add this to your dashboard to monitor token health:

```typescript
// In your dashboard component
const checkTokenHealth = async () => {
  const response = await fetch('/api/debug-tokens');
  const data = await response.json();
  
  // Show warnings if tokens are expiring soon
  // or if refresh tokens are missing
};
```

## Quick Fix Checklist

- [ ] Google Cloud Console: Access type = "Offline"
- [ ] NextAuth config: `access_type: 'offline'` and `prompt: 'consent'`
- [ ] Re-authenticate after configuration changes
- [ ] Test with debug endpoints
- [ ] Monitor token health in your app

## Common Issues

1. **"No refresh token available"** → Google OAuth app not configured for offline access
2. **"Token refresh failed"** → Check Google Cloud Console credentials
3. **"Unauthorized"** → Session expired, user needs to sign in again
4. **"Database error"** → Check Supabase connection and table structure

After implementing these fixes, you should only need to log in once and stay authenticated for weeks or months, with automatic token refresh happening in the background. 