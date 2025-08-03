import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test if connected_accounts table exists
    const { data: accounts, error: accountsError } = await supabase
      .from('connected_accounts')
      .select('*')
      .limit(1);

    if (accountsError) {
      return NextResponse.json({ 
        error: 'Connected accounts table not found',
        details: accountsError.message,
        action: 'Please run the database setup SQL in Supabase'
      }, { status: 404 });
    }

    // Test if events table exists
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      return NextResponse.json({ 
        error: 'Events table not found',
        details: eventsError.message,
        action: 'Please run the database setup SQL in Supabase'
      }, { status: 404 });
    }

    // Test if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      return NextResponse.json({ 
        error: 'Users table not found',
        details: usersError.message,
        action: 'Please run the database setup SQL in Supabase'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'All database tables are ready!',
      tables: {
        connected_accounts: '✅ Ready',
        events: '✅ Ready', 
        users: '✅ Ready'
      }
    });

  } catch (error) {
    console.error('Database verification error:', error);
    return NextResponse.json({ 
      error: 'Database verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 