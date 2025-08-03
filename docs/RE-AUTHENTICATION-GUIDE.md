# Re-authentication Guide

## 🔍 **What's Happening**

You're seeing this error because your Google account access has expired and needs to be refreshed. This is a common security feature with OAuth applications.

### **The Problem**
- Your Google access token has expired
- No refresh token is available to automatically renew it
- The app can't create or delete events without valid credentials

### **The Solution**
You need to re-authenticate with Google to get fresh credentials.

## 🛠️ **How to Fix It**

### **Step 1: Sign Out**
1. Click the "Sign Out" button in the top-right corner of the dashboard
2. You'll be redirected to the sign-in page

### **Step 2: Sign In Again**
1. Click "Sign in with Google"
2. Grant the necessary permissions when prompted
3. This will create fresh access and refresh tokens

### **Step 3: Test the Functionality**
1. Try creating an event with voice input
2. Try syncing your calendar
3. Try deleting an event

## 🔧 **Technical Details**

### **Why This Happens**
- Google OAuth tokens expire for security reasons
- Refresh tokens allow automatic renewal without user intervention
- If no refresh token is stored, manual re-authentication is required

### **What We've Fixed**
- ✅ Better error detection for expired tokens
- ✅ Clear error messages explaining the issue
- ✅ Automatic token refresh when possible
- ✅ Graceful handling when refresh tokens are missing

### **Prevention**
- The app now stores refresh tokens properly
- Future token expirations should be handled automatically
- You shouldn't need to re-authenticate again unless you revoke access

## 🚨 **If You Still Have Issues**

### **Check Your Google Account**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security" > "Third-party apps with account access"
3. Find this app and ensure it has the necessary permissions

### **Clear Browser Data**
1. Clear cookies and site data for localhost
2. Try signing in again

### **Contact Support**
If the issue persists, check:
- Browser console for error messages
- Server logs for detailed debugging info
- Ensure all environment variables are properly configured

## 📝 **Environment Setup**

Make sure your `.env.local` file has the correct Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## ✅ **Success Indicators**

After re-authenticating, you should see:
- ✅ Events sync successfully
- ✅ Voice event creation works
- ✅ Event deletion works
- ✅ No more "needs re-authentication" errors

---

**Note**: This is a one-time fix. Once you re-authenticate, the app should handle future token renewals automatically. 