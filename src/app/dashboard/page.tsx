'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CalendarView from '@/components/CalendarView';
import VoiceInput from '@/components/VoiceInput';
import EventForm from '@/components/EventForm';
import { UnifiedEvent, VoiceEventData } from '@/types/events';
import { useColors } from '@/components/ColorContext';
import { convertVoiceDataToEventData, parseVoiceToEvent } from '@/lib/voice-parser';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { userColors } = useColors();

  // Debug logging
  useEffect(() => {
    console.log('Dashboard mounted');
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [status, session]);

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!session,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      
      // Use the new multi-account sync endpoint
      const response = await fetch('/api/sync/all');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setNotification({ 
        type: 'success', 
        message: `Synced ${data.summary.totalEvents} events from ${data.summary.syncedAccounts} accounts!` 
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: error.message || 'Sync failed' });
      setTimeout(() => setNotification(null), 5000);
    },
    onSettled: () => {
      setIsSyncing(false);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete event');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      const message = data.providerDeleteSuccess 
        ? 'Event deleted successfully from calendar and database!' 
        : `Event deleted from database. Note: ${data.providerError}`;
      setNotification({ type: 'success', message });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: error.message || 'Failed to delete event' });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: VoiceEventData) => {
      setIsCreatingEvent(true);
      
      // Parse the voice input directly using the transcript
      const transcript = eventData.time || eventData.date || '';
      const parsedEvent = parseVoiceToEvent(transcript);
      
      let eventFormData;
      if (parsedEvent) {
        // Use the parsed event data
        eventFormData = {
          title: parsedEvent.title,
          start: parsedEvent.start.toISOString(),
          end: parsedEvent.end.toISOString(),
          description: parsedEvent.description,
          location: parsedEvent.location,
          isAllDay: false,
        };
      } else {
        // Fallback to original conversion
        eventFormData = convertVoiceDataToEventData(eventData);
      }
      
      const response = await fetch('/api/sync/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventFormData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsReAuth) {
          throw new Error('Your Google account needs to be re-authenticated. Please sign out and sign in again with Google.');
        }
        throw new Error(errorData.error || 'Failed to create event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setNotification({ type: 'success', message: 'Event created successfully!' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: error.message || 'Failed to create event' });
      setTimeout(() => setNotification(null), 5000);
    },
    onSettled: () => {
      setIsCreatingEvent(false);
    },
  });



  const handleVoiceEventParsed = (eventData: VoiceEventData) => {
    createEventMutation.mutate(eventData);
  };

  const handleEventClick = (event: UnifiedEvent) => {
    // TODO: Open event details modal
  };

  const handleEventDelete = async (eventId: string) => {
    deleteEventMutation.mutate(eventId);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <a
            href="/auth/signin"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {isSyncing && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="hidden sm:inline">Syncing...</span>
                  </>
                )}
                {isCreatingEvent && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    <span className="hidden sm:inline">Creating event...</span>
                  </>
                )}
                {deleteEventMutation.isPending && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    <span className="hidden sm:inline">Deleting event...</span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => syncMutation.mutate()}
                disabled={isSyncing}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <span className="hidden sm:inline">Sync</span>
                <span className="sm:hidden">🔄</span>
              </button>
              
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              
              <div className="grid grid-cols-4 lg:grid-cols-1 gap-3">
                <button
                  onClick={() => setIsEventFormOpen(true)}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                  title="Add Event"
                >
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl mb-2">
                    ➕
                  </div>
                  <span className="text-sm font-medium text-center">Event</span>
                </button>
                
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                  title="Voice Input"
                >
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl mb-2">
                    🎤
                  </div>
                  <span className="text-sm font-medium text-center">Voice</span>
                </button>
                
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={isSyncing}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  title="Sync Calendars"
                >
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl mb-2">
                    🔄
                  </div>
                  <span className="text-sm font-medium text-center">Sync</span>
                </button>
                
                <a
                  href="/settings"
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                  title="Settings"
                >
                  <div className="w-12 h-12 bg-gray-500 text-white rounded-full flex items-center justify-center text-xl mb-2">
                    ⚙️
                  </div>
                  <span className="text-sm font-medium text-center">Settings</span>
                </a>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <CalendarView 
                events={events} 
                onEventClick={handleEventClick}
                onEventDelete={handleEventDelete}
                userColors={userColors}
              />
            )}
          </div>
        </div>
      </main>

      {/* Voice Input Modal */}
      <VoiceInput
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onEventParsed={handleVoiceEventParsed}
      />

      {/* Manual Event Form Modal */}
      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        onEventParsed={handleVoiceEventParsed}
      />
    </div>
  );
}