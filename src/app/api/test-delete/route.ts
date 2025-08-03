import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a sample event to test deletion
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.email)
      .limit(1);

    if (error || !events || events.length === 0) {
      return NextResponse.json({ 
        message: 'No events found to test deletion',
        events: []
      });
    }

    const testEvent = events[0];
    
    return NextResponse.json({
      message: 'Test event found',
      testEvent: {
        id: testEvent.id,
        title: testEvent.title,
        provider: testEvent.provider,
        hasProviderId: !!(testEvent.google_event_id || testEvent.outlook_event_id)
      }
    });

  } catch (error) {
    console.error('Test delete API error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 