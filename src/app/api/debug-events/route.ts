import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

    // Get URL parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.email)
      .order('start_time', { ascending: true });

    // Add date filters if provided
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: events, error } = await query;

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

    // Get date range info
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      userEmail: session.user.email,
      totalEvents: events?.length || 0,
      eventsByProvider,
      connectedAccounts: accounts || [],
      accountsError: accountsError?.message,
      events: events || [],
      dateRanges: {
        current: now.toISOString(),
        nextWeek: nextWeek.toISOString(),
        nextMonth: nextMonth.toISOString(),
        requestedStart: startDate,
        requestedEnd: endDate
      }
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
