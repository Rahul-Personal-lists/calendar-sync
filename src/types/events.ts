export interface UnifiedEvent {
  id: string;
  provider: 'google' | 'outlook' | 'notion' | 'apple' | 'azure-ad';
  title: string;
  description?: string;
  start_time: string; // ISO 8601 date string
  end_time: string; // ISO 8601 date string
  location?: string;
  notion_page_id?: string;
  google_event_id?: string;
  outlook_event_id?: string;
  apple_event_id?: string;
  color?: string;
  is_all_day?: boolean;
  attendees?: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarProvider {
  id: string;
  name: 'google' | 'outlook' | 'notion' | 'apple' | 'azure-ad';
  displayName: string;
  icon: string;
  isConnected: boolean;
  lastSync?: string;
  color: string;
}

export interface VoiceEventData {
  title: string;
  date?: string;
  time?: string;
  duration?: string;
  location?: string;
  description?: string;
  provider?: 'google' | 'outlook' | 'notion' | 'apple' | 'azure-ad';
}

export interface SyncStatus {
  provider: CalendarProvider['name'];
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: string;
  error?: string;
} 