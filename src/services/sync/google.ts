import { UnifiedEvent } from '@/types/events';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  colorId?: string;
}

export async function fetchGoogleEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  console.log('Fetching Google events with token length:', accessToken?.length || 0);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${timeMin || new Date().toISOString()}&` +
    `timeMax=${timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}&` +
    `singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google API fetch error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to fetch Google events: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function fetchGoogleEventsWithRefresh(
  userEmail: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  const { getValidAccessToken } = await import('@/lib/token-refresh');
  
  const accessToken = await getValidAccessToken(userEmail, 'google');
  
  if (!accessToken) {
    throw new Error('No valid Google access token found for user');
  }

  return fetchGoogleEvents(accessToken, timeMin, timeMax);
}

export function normalizeGoogleEvent(
  googleEvent: GoogleCalendarEvent,
  userId: string
): UnifiedEvent {
  const isAllDay = !googleEvent.start.dateTime;
  const start = googleEvent.start.dateTime || googleEvent.start.date!;
  const end = googleEvent.end.dateTime || googleEvent.end.date!;

  return {
    id: `google_${googleEvent.id}`,
    provider: 'google',
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description,
    start_time: start,
    end_time: end,
    location: googleEvent.location,
    google_event_id: googleEvent.id,
    color: googleEvent.colorId ? getGoogleColor(googleEvent.colorId) : undefined,
    is_all_day: isAllDay,
    attendees: googleEvent.attendees?.map(a => a.email) || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getGoogleColor(colorId: string): string {
  // Google Calendar color mapping
  const colors: Record<string, string> = {
    '1': '#7986cb', // Lavender
    '2': '#33b679', // Sage
    '3': '#8e63ce', // Grape
    '4': '#e67c73', // Flamingo
    '5': '#f6c026', // Banana
    '6': '#f5511d', // Tangerine
    '7': '#039be5', // Peacock
    '8': '#616161', // Graphite
    '9': '#3f51b5', // Blueberry
    '10': '#0b8043', // Basil
    '11': '#d60000', // Tomato
  };
  
  return colors[colorId] || '#4285f4'; // Default Google blue
}

export async function createGoogleEvent(
  accessToken: string,
  event: Omit<UnifiedEvent, 'id' | 'provider' | 'google_event_id' | 'created_at' | 'updated_at'>
): Promise<GoogleCalendarEvent> {
  const googleEvent = {
    summary: event.title,
    description: event.description,
    start: event.is_all_day ? { date: event.start_time } : { dateTime: event.start_time },
    end: event.is_all_day ? { date: event.end_time } : { dateTime: event.end_time },
    location: event.location,
  };

  console.log('Creating Google event with data:', {
    ...googleEvent,
    accessTokenLength: accessToken?.length || 0,
    hasAccessToken: !!accessToken
  });

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google API error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to create Google event: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  return response.json();
}

export async function createGoogleEventWithRefresh(
  userEmail: string,
  event: Omit<UnifiedEvent, 'id' | 'provider' | 'google_event_id' | 'created_at' | 'updated_at'>
): Promise<GoogleCalendarEvent> {
  const { getValidAccessToken } = await import('@/lib/token-refresh');
  
  const accessToken = await getValidAccessToken(userEmail, 'google');
  
  if (!accessToken) {
    throw new Error('No valid Google access token found for user');
  }

  return createGoogleEvent(accessToken, event);
}

export async function deleteGoogleEvent(
  googleEventId: string,
  userEmail: string
): Promise<void> {
  // Get a valid access token (with refresh if needed)
  const { getValidAccessToken } = await import('@/lib/token-refresh');
  
  const accessToken = await getValidAccessToken(userEmail, 'google');
  
  if (!accessToken) {
    throw new Error('No valid Google access token found for user');
  }

  console.log('Deleting Google event:', googleEventId);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google API delete error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to delete Google event: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  console.log('Successfully deleted Google event:', googleEventId);
} 