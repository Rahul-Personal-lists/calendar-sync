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
    const start = startDate || now.toISOString();
    const end = endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${start}&endDateTime=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Outlook events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map(normalizeOutlookEvent);
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