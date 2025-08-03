import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all connected accounts
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch accounts',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      total: accounts?.length || 0,
      accounts: accounts || [],
      providers: accounts?.map(a => a.provider) || []
    });

  } catch (error) {
    console.error('Test connections error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 