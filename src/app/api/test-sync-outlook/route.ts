import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchOutlookEvents } from '@/services/sync/outlook';
import { getValidAccessToken } from '@/lib/token-refresh';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Testing Outlook sync for user:', session.user.email);

    // Get valid Outlook access token
    const accessToken = await getValidAccessToken(session.user.email, 'outlook');
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Outlook account not connected or token invalid',
        userEmail: session.user.email
      }, { status: 400 });
    }

    console.log('Got valid Outlook access token, length:', accessToken.length);

    // Fetch events from Outlook
    const events = await fetchOutlookEvents(accessToken);

    console.log('Fetched Outlook events:', {
      count: events.length,
      events: events.slice(0, 3).map(e => ({ id: e.id, title: e.title, start: e.start_time }))
    });

    return NextResponse.json({ 
      success: true, 
      events: events,
      count: events.length,
      userEmail: session.user.email,
      hasAccessToken: !!accessToken
    });

  } catch (error) {
    console.error('Error testing Outlook sync:', error);
    return NextResponse.json({ 
      error: 'Outlook sync test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      userEmail: session?.user?.email
    }, { status: 500 });
  }
}
