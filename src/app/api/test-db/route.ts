import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection by trying to create a simple table
    const { error: createTestError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, test_field TEXT);'
    });

    if (createTestError) {
      console.error('Error creating test table:', createTestError);
      return NextResponse.json({ 
        error: 'Cannot create tables - likely permission issue', 
        details: createTestError.message 
      }, { status: 500 });
    }

    // Try to create calendar sync tables with prefixed names
    const { error: createUsersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS calendar_users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    const { error: createAccountsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS calendar_connected_accounts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expires_at BIGINT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection working',
      testTableCreated: !createTestError,
      createUsersError: createUsersError?.message || null,
      createAccountsError: createAccountsError?.message || null
    });

  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 