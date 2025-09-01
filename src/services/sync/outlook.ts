import { UnifiedEvent } from '@/types/events';

export interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName?: string;
  };
  body?: {
    content?: string;
  };
  isAllDay?: boolean;
}

export async function fetchOutlookEvents(accessToken: string, startDate?: string, endDate?: string): Promise<UnifiedEvent[]> {
  try {
    const now = new Date();
    // Default to fetching events from 7 days ago to 90 days in the future
    // Use explicit date formatting to ensure proper timezone handling
    const start = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days from now

    console.log('Fetching Outlook events with date range:', { 
      start, 
      end, 
      startDate: startDate ? 'custom' : 'default',
      endDate: endDate ? 'custom' : 'default'
    });

    let allEvents: any[] = [];
    let nextLink: string | null = null;
    let pageCount = 0;

    do {
      const url: string = nextLink || `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${start}&endDateTime=${end}&$top=100`;
      
      console.log(`Fetching page ${pageCount + 1}:`, url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Outlook API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Outlook API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch Outlook events: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Page ${pageCount + 1} response:`, {
        hasValue: !!data.value,
        valueLength: data.value?.length || 0,
        hasNextLink: !!data['@odata.nextLink'],
        firstEvent: data.value?.[0] ? {
          id: data.value[0].id,
          subject: data.value[0].subject,
          start: data.value[0].start?.dateTime
        } : null,
        lastEvent: data.value?.[data.value.length - 1] ? {
          id: data.value[data.value.length - 1].id,
          subject: data.value[data.value.length - 1].subject,
          start: data.value[data.value.length - 1].start?.dateTime
        } : null
      });

      allEvents = allEvents.concat(data.value || []);
      nextLink = data['@odata.nextLink'] || null;
      pageCount++;
    } while (nextLink && pageCount < 10); // Limit to 10 pages to prevent infinite loops

    console.log('Total Outlook events fetched:', {
      totalEvents: allEvents.length,
      pagesFetched: pageCount,
      dateRange: allEvents.length > 0 ? {
        earliest: allEvents[0]?.start?.dateTime,
        latest: allEvents[allEvents.length - 1]?.start?.dateTime
      } : null
    });

    return allEvents.map(normalizeOutlookEvent);
  } catch (error) {
    console.error('Error fetching Outlook events:', error);
    throw error;
  }
}

export function normalizeOutlookEvent(event: OutlookEvent): UnifiedEvent {
  return {
    id: event.id,
    provider: 'azure-ad', // Changed from 'outlook' to 'azure-ad' to match the account provider
    title: event.subject || 'Untitled Event',
    start_time: event.start.dateTime,
    end_time: event.end.dateTime,
    location: event.location?.displayName,
    description: event.body?.content,
    is_all_day: event.isAllDay || false,
    outlook_event_id: event.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function createOutlookEvent(accessToken: string, event: Omit<UnifiedEvent, 'id' | 'provider' | 'created_at' | 'updated_at'>): Promise<UnifiedEvent> {
  try {
    const outlookEvent = {
      subject: event.title,
      start: {
        dateTime: event.start_time,
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.end_time,
        timeZone: 'UTC',
      },
      location: event.location ? {
        displayName: event.location,
      } : undefined,
      body: event.description ? {
        content: event.description,
        contentType: 'text',
      } : undefined,
      isAllDay: event.is_all_day,
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookEvent),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Outlook event: ${response.statusText}`);
    }

    const createdEvent = await response.json();
    return normalizeOutlookEvent(createdEvent);
  } catch (error) {
    console.error('Error creating Outlook event:', error);
    throw error;
  }
}

export async function deleteOutlookEvent(
  outlookEventId: string,
  userEmail: string
): Promise<void> {
  // Get a valid access token (with refresh if needed)
  const { getValidAccessToken } = await import('@/lib/token-refresh');
  
  const accessToken = await getValidAccessToken(userEmail, 'outlook');
  
  if (!accessToken) {
    throw new Error('No valid Outlook access token found for user');
  }

  console.log('Deleting Outlook event:', outlookEventId);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Outlook API delete error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to delete Outlook event: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  console.log('Successfully deleted Outlook event:', outlookEventId);
}

export async function updateOutlookEvent(
  outlookEventId: string,
  updateData: Partial<UnifiedEvent>,
  userEmail: string
): Promise<OutlookEvent> {
  // Get a valid access token (with refresh if needed)
  const { getValidAccessToken } = await import('@/lib/token-refresh');
  
  const accessToken = await getValidAccessToken(userEmail, 'outlook');
  
  if (!accessToken) {
    throw new Error('No valid Outlook access token found for user');
  }

  console.log('Updating Outlook event:', outlookEventId, 'with data:', updateData);

  // Convert our event data to Outlook format
  const outlookEvent = {
    subject: updateData.title,
    start: {
      dateTime: updateData.start_time,
      timeZone: 'UTC',
    },
    end: {
      dateTime: updateData.end_time,
      timeZone: 'UTC',
    },
    location: updateData.location ? {
      displayName: updateData.location,
    } : undefined,
    body: updateData.description ? {
      content: updateData.description,
      contentType: 'text',
    } : undefined,
    isAllDay: updateData.is_all_day,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookEvent),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Outlook API update error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to update Outlook event: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const updatedEvent = await response.json();
  console.log('Successfully updated Outlook event:', outlookEventId);
  return updatedEvent;
}

export async function updateOutlookEventWithRefresh(
  outlookEventId: string,
  updateData: Partial<UnifiedEvent>,
  userEmail: string
): Promise<OutlookEvent> {
  return updateOutlookEvent(outlookEventId, updateData, userEmail);
} 