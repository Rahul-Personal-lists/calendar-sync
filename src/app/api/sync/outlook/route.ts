import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchOutlookEvents } from '@/services/sync/outlook';
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

    // Get valid Outlook access token (with refresh if needed)
    const accessToken = await getValidAccessToken(session.user.email, 'outlook');
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Outlook account not connected or token invalid' }, { status: 400 });
    }

    // Fetch events from Outlook
    const events = await fetchOutlookEvents(accessToken);

    // Store events in database
    if (events.length > 0) {
      const { error: insertError } = await supabase
        .from('events')
        .upsert(
          events.map(event => ({
            user_id: session.user.email,
            provider: event.provider,
            title: event.title,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
            description: event.description,
            is_all_day: event.is_all_day,
            outlook_event_id: event.outlook_event_id,
          })),
          { onConflict: 'user_id,outlook_event_id' }
        );

      if (insertError) {
        console.error('Error storing Outlook events:', insertError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      events: events,
      count: events.length 
    });

  } catch (error) {
    console.error('Error syncing Outlook events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 