import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = params;

    // Delete the connected account for this user and provider
    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('user_id', session.user.email)
      .eq('provider', provider);

    if (error) {
      console.error('Error disconnecting provider:', error);
      return NextResponse.json({ error: 'Failed to disconnect provider' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Disconnect provider API error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect provider' },
      { status: 500 }
    );
  }
} 