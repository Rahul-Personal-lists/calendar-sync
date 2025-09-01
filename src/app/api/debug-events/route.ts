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

    // Get all events for the user
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

    // Get connected accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', session.user.email);

    // Group events by provider
    const eventsByProvider = events?.reduce((acc, event) => {
      if (!acc[event.provider]) {
        acc[event.provider] = [];
      }
      acc[event.provider].push(event);
      return acc;
    }, {} as Record<string, any[]>) || {};

    return NextResponse.json({
      userEmail: session.user.email,
      totalEvents: events?.length || 0,
      eventsByProvider,
      connectedAccounts: accounts || [],
      accountsError: accountsError?.message,
      events: events || []
    });

  } catch (error) {
    console.error('Debug events API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
