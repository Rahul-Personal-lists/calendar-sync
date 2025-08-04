import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGoogleEvents, normalizeGoogleEvent, createGoogleEvent } from '@/services/sync/google';
import { supabase } from '@/lib/supabase';
import { getValidAccessToken, needsReAuthentication } from '@/lib/token-refresh';

export async function GET(request: NextRequest) {
  let session: any;
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if re-authentication is needed
    const needsReAuth = await needsReAuthentication(session.user.email, 'google');
    if (needsReAuth) {
      return NextResponse.json({ 
        error: 'Google account needs re-authentication',
        needsReAuth: true,
        message: 'Please sign in with Google again to refresh your access'
      }, { status: 401 });
    }

    // Get valid Google access token (with refresh if needed)
    const accessToken = await getValidAccessToken(session.user.email, 'google');
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Google account not connected or token invalid',
        message: 'Please sign in with Google again'
      }, { status: 400 });
    }

    // Fetch events from Google Calendar
    const googleEvents = await fetchGoogleEvents(accessToken);
    
    // Normalize and store events
    const unifiedEvents = googleEvents.map(event => 
      normalizeGoogleEvent(event, session.user!.email!)
    );

    // Store events in database
    const { error: insertError } = await supabase
      .from('events')
      .upsert(
        unifiedEvents.map(event => ({
          user_id: session.user!.email,
          provider: event.provider,
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          google_event_id: event.google_event_id,
          color: event.color,
          is_all_day: event.is_all_day || false,
          repeat: event.repeat,
        })),
        { onConflict: 'user_id,google_event_id' }
      );

    if (insertError) {
      console.error('Error storing events:', insertError);
      return NextResponse.json({ error: 'Failed to store events' }, { status: 500 });
    }

    // Log sync
    await supabase
      .from('sync_logs')
      .insert({
        user_id: session.user!.email,
        provider: 'google',
        status: 'success',
        events_synced: unifiedEvents.length,
      });

    return NextResponse.json({
      success: true,
      eventsSynced: unifiedEvents.length,
      events: unifiedEvents,
    });

  } catch (error) {
    console.error('Google sync error:', error);
    
    // Log error
    if (session?.user?.email) {
      await supabase
        .from('sync_logs')
        .insert({
          user_id: session.user.email,
          provider: 'google',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
    }

    return NextResponse.json(
      { error: 'Failed to sync Google Calendar' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Creating event with data:', body);
    const { title, start, end, description, location, isAllDay, repeat } = body;

    // Check if re-authentication is needed
    const needsReAuth = await needsReAuthentication(session.user.email, 'google');
    if (needsReAuth) {
      return NextResponse.json({ 
        error: 'Google account needs re-authentication',
        needsReAuth: true,
        message: 'Please sign in with Google again to create events'
      }, { status: 401 });
    }

    // Get valid Google access token (with refresh if needed)
    console.log('Looking for Google account for user:', session.user.email);
    const accessToken = await getValidAccessToken(session.user.email, 'google');
    
    if (!accessToken) {
      console.log('No valid Google account found for user:', session.user.email);
      return NextResponse.json({ 
        error: 'Google account not connected or token invalid. Please sign in with Google again.',
        needsReAuth: true
      }, { status: 400 });
    }

    console.log('Found valid Google account for user:', session.user.email);

    // Create event in Google Calendar
    const googleEvent = await createGoogleEvent(accessToken, {
      title,
      start_time: start,
      end_time: end,
      description,
      location,
      is_all_day: isAllDay,
      repeat,
    });

    // Store in database
    const unifiedEvent = normalizeGoogleEvent(googleEvent, session.user!.email!);
    
    const { error: insertError } = await supabase
      .from('events')
      .insert({
        user_id: session.user!.email,
        provider: 'google',
        title: unifiedEvent.title,
        description: unifiedEvent.description,
        start_time: unifiedEvent.start_time,
        end_time: unifiedEvent.end_time,
        location: unifiedEvent.location,
        google_event_id: unifiedEvent.google_event_id,
        color: unifiedEvent.color,
        is_all_day: unifiedEvent.is_all_day || false,
        repeat: repeat,
      });

    if (insertError) {
      console.error('Error storing event:', insertError);
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event: unifiedEvent,
    });

  } catch (error) {
    console.error('Google event creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to create Google Calendar event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 