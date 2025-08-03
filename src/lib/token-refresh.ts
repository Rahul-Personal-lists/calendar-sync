import { supabase } from './supabase';

export async function refreshGoogleToken(
  refreshToken: string,
  userId: string
): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    console.log('Attempting to refresh Google token for user:', userId);
    console.log('Refresh token length:', refreshToken?.length || 0);
    console.log('Google client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    console.log('Google client secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    console.log('Token refresh response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to refresh Google token:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return null;
    }

    const data = await response.json();
    console.log('Token refresh successful, new token length:', data.access_token?.length || 0);
    
    // Update the database with the new token
    const { error } = await supabase
      .from('connected_accounts')
      .update({
        access_token: data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (error) {
      console.error('Failed to update refreshed token in database:', error);
      return null;
    }

    console.log('Successfully updated token in database');

    return {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

export async function getValidAccessToken(
  userId: string,
  provider: 'google' | 'outlook'
): Promise<string | null> {
  try {
    console.log(`Getting valid access token for ${provider} user: ${userId}`);
    
    // Map provider names to database values
    const dbProvider = provider === 'outlook' ? 'azure-ad' : provider;
    
    // Get the current token from database
    const { data: account, error } = await supabase
      .from('connected_accounts')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', dbProvider)
      .single();

    if (error || !account) {
      console.error(`No ${provider} account found for user:`, userId, error);
      return null;
    }

    console.log(`Found ${provider} account for user ${userId}:`, {
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token,
      expiresAt: account.expires_at,
      currentTime: Math.floor(Date.now() / 1000)
    });

    // Check if token is expired (with 5 minute buffer)
    const isExpired = account.expires_at && 
      (Date.now() / 1000) > (account.expires_at - 300);

    if (isExpired) {
      if (account.refresh_token) {
        console.log(`Refreshing expired ${provider} token for user:`, userId);
        
        if (provider === 'google') {
          const refreshed = await refreshGoogleToken(account.refresh_token, userId);
          if (refreshed) {
            console.log(`Successfully refreshed ${provider} token for user:`, userId);
            return refreshed.accessToken;
          } else {
            console.error(`Failed to refresh ${provider} token for user:`, userId);
            return null;
          }
        } else if (provider === 'outlook') {
          // TODO: Add Outlook token refresh
          console.log('Outlook token refresh not implemented yet');
          return null;
        }
      } else {
        console.error(`Token expired but no refresh token available for ${provider} user:`, userId);
        // Return null to indicate re-authentication is needed
        return null;
      }
    } else {
      console.log(`Using existing valid ${provider} token for user:`, userId);
    }

    return account.access_token;
  } catch (error) {
    console.error(`Error getting valid ${provider} access token:`, error);
    return null;
  }
}

export async function needsReAuthentication(
  userId: string,
  provider: 'google' | 'outlook'
): Promise<boolean> {
  try {
    const dbProvider = provider === 'outlook' ? 'azure-ad' : provider;
    
    const { data: account, error } = await supabase
      .from('connected_accounts')
      .select('refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', dbProvider)
      .single();

    if (error || !account) {
      return true; // No account found, needs re-auth
    }

    // Check if token is expired and no refresh token available
    const isExpired = account.expires_at && 
      (Date.now() / 1000) > (account.expires_at - 300);

    return isExpired && !account.refresh_token;
  } catch (error) {
    console.error(`Error checking re-authentication status for ${provider}:`, error);
    return true; // Assume needs re-auth on error
  }
} 