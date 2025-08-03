import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldProvider, newProvider } = await request.json();

    if (!oldProvider || !newProvider) {
      return NextResponse.json({ error: 'Missing provider information' }, { status: 400 });
    }

    // Update events with the old provider name to use the new provider name
    const { error } = await supabase
      .from('events')
      .update({ provider: newProvider })
      .eq('user_id', session.user.email)
      .eq('provider', oldProvider);

    if (error) {
      console.error('Error updating event providers:', error);
      return NextResponse.json({ 
        error: 'Failed to update events',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated events from ${oldProvider} to ${newProvider}`,
      updatedCount: 'unknown'
    });

  } catch (error) {
    console.error('Update event providers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update event providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 