import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // For now, just return the OAuth URL for the provider
    let authUrl = '';
    
    if (provider === 'google') {
      const googleAuthUrl = new URL('https://accounts.google.com/oauth/authorize');
      googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
      googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');
      authUrl = googleAuthUrl.toString();
    } else if (provider === 'azure-ad') {
      const outlookAuthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      outlookAuthUrl.searchParams.set('client_id', process.env.OUTLOOK_CLIENT_ID!);
      outlookAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`);
      outlookAuthUrl.searchParams.set('response_type', 'code');
      outlookAuthUrl.searchParams.set('scope', 'openid email profile Calendars.ReadWrite');
      authUrl = outlookAuthUrl.toString();
    }

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Connect provider error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate auth URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 