import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchOutlookEvents } from '@/services/sync/outlook';
import { getValidAccessToken } from '@/lib/token-refresh';
import { UnifiedEvent } from '@/types/events';

export async function GET(request: NextRequest) {
  let session;
  
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restrict debug endpoints to development or admin users
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAdmin = session.user.email === process.env.ADMIN_EMAIL;
    
    if (!isDevelopment && !isAdmin) {
      return NextResponse.json({ error: 'Debug endpoints only available in development or to admin users' }, { status: 403 });
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

    // Group events by week to see distribution
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const currentWeekEvents = events.filter(e => new Date(e.start_time) <= nextWeek);
    const nextWeekEvents = events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate > nextWeek && eventDate <= nextMonth;
    });
    const futureEvents = events.filter(e => new Date(e.start_time) > nextMonth);

    // Test fetching events specifically for next week
    const nextWeekStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    let nextWeekSpecificEvents: UnifiedEvent[] = [];
    try {
      nextWeekSpecificEvents = await fetchOutlookEvents(
        accessToken, 
        nextWeekStart.toISOString(), 
        nextWeekEnd.toISOString()
      );
    } catch (error) {
      console.log('Error fetching next week specific events:', error);
    }

    console.log('Fetched Outlook events:', {
      totalCount: events.length,
      currentWeekCount: currentWeekEvents.length,
      nextWeekCount: nextWeekEvents.length,
      futureCount: futureEvents.length,
      nextWeekSpecificCount: nextWeekSpecificEvents.length,
      sampleEvents: events.slice(0, 5).map(e => ({ 
        id: e.id, 
        title: e.title, 
        start: e.start_time,
        week: new Date(e.start_time).toISOString().split('T')[0]
      })),
      nextWeekSample: nextWeekSpecificEvents.slice(0, 3).map(e => ({
        id: e.id,
        title: e.title,
        start: e.start_time,
        week: new Date(e.start_time).toISOString().split('T')[0]
      }))
    });

    return NextResponse.json({ 
      success: true, 
      events: events,
      count: events.length,
      userEmail: session.user.email,
      hasAccessToken: !!accessToken,
      eventBreakdown: {
        totalCount: events.length,
        currentWeekCount: currentWeekEvents.length,
        nextWeekCount: nextWeekEvents.length,
        futureCount: futureEvents.length,
        nextWeekSpecificCount: nextWeekSpecificEvents.length,
        sampleEvents: events.slice(0, 5).map(e => ({ 
          id: e.id, 
          title: e.title, 
          start: e.start_time,
          week: new Date(e.start_time).toISOString().split('T')[0]
        })),
        nextWeekSample: nextWeekSpecificEvents.slice(0, 3).map(e => ({
          id: e.id,
          title: e.title,
          start: e.start_time,
          week: new Date(e.start_time).toISOString().split('T')[0]
        }))
      }
    });

  } catch (error) {
    console.error('Error testing Outlook sync:', error);
    return NextResponse.json({ 
      error: 'Outlook sync test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      userEmail: session?.user?.email || 'unknown'
    }, { status: 500 });
  }
}
