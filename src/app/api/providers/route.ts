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

    // Fetch connected accounts for the current user
    const { data: providers, error } = await supabase
      .from('connected_accounts')
      .select('provider, created_at, user_id, access_token')
      .eq('user_id', session.user.email);

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        console.log('Connected accounts table does not exist yet, returning empty array');
        return NextResponse.json([]);
      }
      
      console.error('Error fetching providers:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    return NextResponse.json(providers || []);

  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
} 