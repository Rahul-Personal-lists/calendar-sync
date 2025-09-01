import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/token-refresh';

export async function GET(request: NextRequest) {
  let session;
  
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Testing Outlook calendar API for user:', session.user.email);

    // Get valid Outlook access token
    const accessToken = await getValidAccessToken(session.user.email, 'outlook');
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Outlook account not connected or token invalid',
        userEmail: session.user.email
      }, { status: 400 });
    }

    console.log('Got valid Outlook access token, length:', accessToken.length);

    // Test different date ranges
    const now = new Date();
    const nextWeekStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const nextMonthStart = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextMonthEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const testRanges = [
      { name: 'Next Week', start: nextWeekStart.toISOString(), end: nextWeekEnd.toISOString() },
      { name: 'Next Month', start: nextMonthStart.toISOString(), end: nextMonthEnd.toISOString() },
      { name: 'Next 3 Months', start: now.toISOString(), end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const results = [];

    for (const range of testRanges) {
      try {
        console.log(`Testing ${range.name} range:`, { start: range.start, end: range.end });
        
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${range.start}&endDateTime=${range.end}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            range: range.name,
            success: true,
            count: data.value?.length || 0,
            events: data.value?.slice(0, 3).map((e: any) => ({
              id: e.id,
              subject: e.subject,
              start: e.start?.dateTime,
              end: e.end?.dateTime,
              isAllDay: e.isAllDay,
              recurrence: e.recurrence ? 'Yes' : 'No'
            })) || []
          });
        } else {
          const errorText = await response.text();
          results.push({
            range: range.name,
            success: false,
            error: `${response.status}: ${errorText}`
          });
        }
      } catch (error) {
        results.push({
          range: range.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      userEmail: session.user.email,
      hasAccessToken: !!accessToken,
      testResults: results
    });

  } catch (error) {
    console.error('Error testing Outlook calendar:', error);
    return NextResponse.json({ 
      error: 'Outlook calendar test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      userEmail: session?.user?.email || 'unknown'
    }, { status: 500 });
  }
}
