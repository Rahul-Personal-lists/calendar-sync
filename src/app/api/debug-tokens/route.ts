import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getValidAccessToken } from '@/lib/token-refresh';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Debug tokens for user:', session.user.email);

    // Get all connected accounts for the user
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', session.user.email);

    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    console.log('Found accounts:', accounts);

    // Test token refresh for each provider
    const tokenStatus: Record<string, any> = {};
    
    for (const account of accounts || []) {
      const provider = account.provider === 'azure-ad' ? 'outlook' : account.provider;
      
      try {
        console.log(`Testing token for ${provider}...`);
        const token = await getValidAccessToken(session.user.email, provider);
        
        tokenStatus[provider] = {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          accountId: account.id,
          expiresAt: account.expires_at,
          hasRefreshToken: !!account.refresh_token
        };
        
        console.log(`${provider} token status:`, tokenStatus[provider]);
      } catch (error) {
        console.error(`Error testing ${provider} token:`, error);
        tokenStatus[provider] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          accountId: account.id
        };
      }
    }

    return NextResponse.json({
      user: session.user.email,
      accounts: accounts?.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        hasAccessToken: !!acc.access_token,
        hasRefreshToken: !!acc.refresh_token,
        expiresAt: acc.expires_at,
        createdAt: acc.created_at
      })),
      tokenStatus
    });

  } catch (error) {
    console.error('Debug tokens error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 