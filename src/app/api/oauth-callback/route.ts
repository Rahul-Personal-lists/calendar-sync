import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=missing_params`);
    }

    // Decode state to get user and provider info
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { user, provider, type } = stateData;

    if (type !== 'additional_connection') {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=invalid_state`);
    }

    // Exchange code for tokens
    let tokens;
    if (provider === 'google') {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth-callback`,
        }),
      });

      tokens = await tokenResponse.json();
    } else if (provider === 'azure-ad') {
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth-callback`,
        }),
      });

      tokens = await tokenResponse.json();
    }

    if (!tokens || tokens.error) {
      console.error('Token exchange failed:', tokens);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=token_exchange_failed`);
    }

    // Store the connection in database
    const { error: dbError } = await supabase
      .from('connected_accounts')
      .insert({
        user_id: user,
        provider: provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=database_error`);
    }

    console.log('Successfully connected additional provider:', { user, provider });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?success=connected`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=callback_error`);
  }
} 