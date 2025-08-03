import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.email)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Supabase error fetching events:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch events',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json(events || []);

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    console.log(`Attempting to delete event ${eventId} for user ${session.user.email}`);

    // First, get the event to check ownership and get provider info
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', session.user.email)
      .single();

    if (fetchError || !event) {
      console.error('Event not found or access denied:', { eventId, userEmail: session.user.email, error: fetchError });
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 });
    }

    console.log('Found event to delete:', {
      id: event.id,
      title: event.title,
      provider: event.provider,
      hasGoogleId: !!event.google_event_id,
      hasOutlookId: !!event.outlook_event_id
    });

    // Delete from the original provider if we have the provider event ID
    let providerDeleteSuccess = true;
    let providerError = null;

    try {
      if (event.provider === 'google' && event.google_event_id) {
        console.log('Attempting to delete from Google Calendar:', event.google_event_id);
        // Import and call Google delete function
        const { deleteGoogleEvent } = await import('@/services/sync/google');
        await deleteGoogleEvent(event.google_event_id, session.user.email);
        console.log('Successfully deleted from Google Calendar');
      } else if (event.provider === 'outlook' && event.outlook_event_id) {
        console.log('Attempting to delete from Outlook:', event.outlook_event_id);
        // Import and call Outlook delete function
        const { deleteOutlookEvent } = await import('@/services/sync/outlook');
        await deleteOutlookEvent(event.outlook_event_id, session.user.email);
        console.log('Successfully deleted from Outlook');
      } else {
        console.log('No provider-specific ID found, skipping provider deletion');
      }
      // Add other providers as needed
    } catch (error) {
      console.error(`Failed to delete event from ${event.provider}:`, error);
      providerDeleteSuccess = false;
      providerError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Delete from our database
    console.log('Deleting event from database:', eventId);
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', session.user.email);

    if (deleteError) {
      console.error('Supabase error deleting event:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete event from database',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('Successfully deleted event from database');

    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully',
      providerDeleteSuccess,
      providerError
    });

  } catch (error) {
    console.error('Delete event API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 