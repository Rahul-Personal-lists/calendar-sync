import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGoogleEvents, normalizeGoogleEvent } from '@/services/sync/google';
import { fetchOutlookEvents } from '@/services/sync/outlook';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    // Get all connected accounts for this user
    const { data: accounts, error: accountsError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', session.user.email);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No connected accounts found',
        events: [],
        summary: { totalEvents: 0, syncedAccounts: 0 }
      });
    }

    const allEvents = [];
    const syncResults = [];

    // Sync each connected account
    for (const account of accounts) {
      try {
        if (account.provider === 'google') {
          // Check if token is expired
          if (account.expires_at && Date.now() > account.expires_at * 1000) {
            syncResults.push({ provider: 'google', status: 'skipped', reason: 'token_expired' });
            continue;
          }

          // Fetch Google events
          const googleEvents = await fetchGoogleEvents(account.access_token);
          const normalizedEvents = googleEvents.map(event => 
            normalizeGoogleEvent(event, session.user!.email!)
          );

          // Store Google events
          if (normalizedEvents.length > 0) {
            const { error: insertError } = await supabase
              .from('events')
              .upsert(
                normalizedEvents.map(event => ({
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
                })),
                { onConflict: 'user_id,google_event_id' }
              );

            if (insertError) {
              console.error('Error storing Google events:', insertError);
              syncResults.push({ provider: 'google', status: 'error', error: insertError.message });
            } else {
              allEvents.push(...normalizedEvents);
              syncResults.push({ provider: 'google', status: 'success', eventsCount: normalizedEvents.length });
            }
          } else {
            syncResults.push({ provider: 'google', status: 'success', eventsCount: 0 });
          }

        } else if (account.provider === 'azure-ad') {
          // Check if token is expired
          if (account.expires_at && new Date(account.expires_at * 1000) < new Date()) {
            syncResults.push({ provider: 'azure-ad', status: 'skipped', reason: 'token_expired' });
            continue;
          }

          // Fetch Outlook events
          const outlookEvents = await fetchOutlookEvents(account.access_token);

          // Store Outlook events
          if (outlookEvents.length > 0) {
            const { error: insertError } = await supabase
              .from('events')
              .upsert(
                outlookEvents.map(event => ({
                  user_id: session.user!.email,
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
              syncResults.push({ provider: 'azure-ad', status: 'error', error: insertError.message });
            } else {
              allEvents.push(...outlookEvents);
              syncResults.push({ provider: 'azure-ad', status: 'success', eventsCount: outlookEvents.length });
            }
          } else {
            syncResults.push({ provider: 'azure-ad', status: 'success', eventsCount: 0 });
          }
        }

      } catch (error) {
        console.error(`Error syncing ${account.provider}:`, error);
        syncResults.push({ 
          provider: account.provider, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Log sync results
    await supabase
      .from('sync_logs')
      .insert({
        user_id: session.user!.email,
        provider: 'all',
        status: 'success',
        events_synced: allEvents.length,
        details: JSON.stringify(syncResults),
      });

    return NextResponse.json({
      success: true,
      events: allEvents,
      summary: {
        totalEvents: allEvents.length,
        syncedAccounts: accounts.length
      }
    });

  } catch (error) {
    console.error('All sync error:', error);
    
    // Log error
    if (session?.user?.email) {
      await supabase
        .from('sync_logs')
        .insert({
          user_id: session.user.email,
          provider: 'all',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
    }

    return NextResponse.json(
      { error: 'Failed to sync calendars' },
      { status: 500 }
    );
  }
} 