import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/token-refresh';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;

    // Get raw account data from database
    const { data: googleAccount, error: googleError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    const { data: outlookAccount, error: outlookError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'azure-ad')
      .single();

    // Test token refresh for Google
    let googleTokenStatus = 'not_connected';
    let googleValidToken = null;
    
    if (googleAccount) {
      const isExpired = googleAccount.expires_at && 
        (Date.now() / 1000) > (googleAccount.expires_at - 300);
      
      googleTokenStatus = isExpired ? 'expired' : 'valid';
      
      if (googleAccount.refresh_token) {
        try {
          googleValidToken = await getValidAccessToken(userId, 'google');
          if (googleValidToken) {
            googleTokenStatus = 'refreshed';
          }
        } catch (error) {
          console.error('Error refreshing Google token:', error);
          googleTokenStatus = 'refresh_failed';
        }
      }
    }

    // Test token refresh for Outlook
    let outlookTokenStatus = 'not_connected';
    let outlookValidToken = null;
    
    if (outlookAccount) {
      const isExpired = outlookAccount.expires_at && 
        (Date.now() / 1000) > (outlookAccount.expires_at - 300);
      
      outlookTokenStatus = isExpired ? 'expired' : 'valid';
      
      if (outlookAccount.refresh_token) {
        try {
          outlookValidToken = await getValidAccessToken(userId, 'outlook');
          if (outlookValidToken) {
            outlookTokenStatus = 'refreshed';
          }
        } catch (error) {
          console.error('Error refreshing Outlook token:', error);
          outlookTokenStatus = 'refresh_failed';
        }
      }
    }

    return NextResponse.json({
      user: userId,
      google: {
        connected: !!googleAccount,
        tokenStatus: googleTokenStatus,
        hasRefreshToken: !!googleAccount?.refresh_token,
        expiresAt: googleAccount?.expires_at,
        isExpired: googleAccount?.expires_at ? (Date.now() / 1000) > googleAccount.expires_at : null,
        validToken: !!googleValidToken,
        error: googleError?.message
      },
      outlook: {
        connected: !!outlookAccount,
        tokenStatus: outlookTokenStatus,
        hasRefreshToken: !!outlookAccount?.refresh_token,
        expiresAt: outlookAccount?.expires_at,
        isExpired: outlookAccount?.expires_at ? (Date.now() / 1000) > outlookAccount.expires_at : null,
        validToken: !!outlookValidToken,
        error: outlookError?.message
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token refresh test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 