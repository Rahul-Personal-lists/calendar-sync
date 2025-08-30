'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarProvider } from '@/types/events';
import ColorPicker from '@/components/ColorPicker';
import { useColors } from '@/components/ColorContext';
import ProviderIcon from '@/components/ProviderIcon';
import { getProviderAccountEmail } from '@/lib/provider-utils';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [autoSync, setAutoSync] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { userColors, updateColor } = useColors();

  // Check for URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      setMessage({ type: 'success', text: 'Calendar connected successfully!' });
      // Clear the URL parameter
      window.history.replaceState({}, '', '/settings');
    } else if (error) {
      setMessage({ type: 'error', text: `Connection failed: ${error}` });
      // Clear the URL parameter
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  // Fetch connected accounts
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await fetch('/api/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      return data;
    },
    enabled: !!session,
  });

  // Connect provider mutation
  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      // Use the connect-additional endpoint for additional providers
      const response = await fetch('/api/connect-additional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect provider');
      }
      
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });

  // Disconnect provider mutation
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await fetch(`/api/providers/${provider}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to disconnect provider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });

  const handleConnect = (provider: string) => {
    connectMutation.mutate(provider);
  };

  const getConnectionStatus = (provider: string) => {
    if (connectMutation.isPending && connectMutation.variables === provider) {
      return 'Connecting...';
    }
    if (disconnectMutation.isPending && disconnectMutation.variables === provider) {
      return 'Disconnecting...';
    }
    return null;
  };

  const handleDisconnect = (provider: string) => {
    if (confirm(`Are you sure you want to disconnect ${provider}?`)) {
      disconnectMutation.mutate(provider);
    }
  };

  const handleColorChange = (provider: string, color: string) => {
    updateColor(provider, color);
    setHasUnsavedChanges(true);
  };

  const handleSaveAllChanges = async () => {
    try {
      // Update all providers that might have old provider names
      const updates = [
        { oldProvider: 'outlook', newProvider: 'azure-ad' },
        // Add more mappings if needed
      ];

      for (const update of updates) {
        const response = await fetch('/api/update-event-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${update.oldProvider} events`);
        }
      }

      setMessage({ type: 'success', text: 'All colors saved and events updated successfully!' });
      setHasUnsavedChanges(false);
      // Invalidate events query to refresh the calendar
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      setMessage({ type: 'error', text: `Error updating events: ${error}` });
    }
    
    setTimeout(() => setMessage(null), 5000);
  };

  const providerConfigs: CalendarProvider[] = [
    {
      id: 'google',
      name: 'google',
      displayName: 'Google Calendar',
      icon: 'G',
      isConnected: providers.some((p: { provider: string }) => p.provider === 'google'),
      color: '#4285f4',
    },
    {
      id: 'outlook',
      name: 'azure-ad',
      displayName: 'Outlook Calendar',
      icon: 'O',
      isConnected: providers.some((p: { provider: string }) => p.provider === 'azure-ad'),
      color: '#0078d4',
    },
    {
      id: 'notion',
      name: 'notion',
      displayName: 'Notion Calendar',
      icon: 'N',
      isConnected: providers.some((p: { provider: string }) => p.provider === 'notion'),
      color: '#000000',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center">
            <a 
              href="/dashboard" 
              className="mr-4 text-gray-600 hover:text-gray-800 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile-first layout */}
      <main className="px-4 py-6 space-y-6">
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-start justify-between">
              <span className="flex-1">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="ml-3 text-lg font-bold hover:text-gray-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Calendar Connections Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Calendar Connections</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Connect multiple calendar accounts to sync events across all platforms
                </p>
              </div>
              <div className="flex items-center justify-center sm:justify-end">
                <div className="bg-blue-50 rounded-full px-4 py-2">
                  <div className="text-xl font-bold text-blue-600">
                    {providers.filter((p: { provider: string }) => p.provider).length}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Connected</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-400 text-4xl mb-2">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No calendars connected</h3>
                    <p className="text-gray-600 mb-4 px-4">
                      Connect your first calendar to start syncing events across all your accounts
                    </p>
                  </div>
                )}
                {providerConfigs.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      <ProviderIcon provider={provider.name} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{provider.displayName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {getConnectionStatus(provider.name) || 
                           (provider.isConnected ? `Connected (${getProviderAccountEmail(provider.name, session?.user?.email || '')})` : 'Not connected')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-start">
                      {provider.isConnected ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600 font-medium">Connected</span>
                          </div>
                          <button
                            onClick={() => handleDisconnect(provider.name)}
                            disabled={disconnectMutation.isPending}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {disconnectMutation.isPending && disconnectMutation.variables === provider.name 
                              ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(provider.name)}
                          disabled={connectMutation.isPending}
                          className="w-full sm:w-auto px-6 py-3 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {connectMutation.isPending && connectMutation.variables === provider.name 
                            ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Colors Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">Calendar Colors</h2>
                {hasUnsavedChanges && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                    Unsaved changes
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  if (showColorSettings && hasUnsavedChanges) {
                    if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                      setShowColorSettings(false);
                      setHasUnsavedChanges(false);
                    }
                  } else {
                    setShowColorSettings(!showColorSettings);
                  }
                }}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                {showColorSettings ? 'Hide' : 'Customize'}
              </button>
            </div>
          </div>

          {showColorSettings && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-6 px-1">
                Choose custom colors for each calendar provider to easily distinguish your events.
              </p>
              
              <div className="space-y-4">
                {providerConfigs.map((provider) => (
                  <div key={provider.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      <ProviderIcon provider={provider.name} size={32} />
                      <div>
                        <div className="font-medium text-gray-900">{provider.displayName}</div>
                        <div className="text-sm text-gray-500">
                          {provider.isConnected ? 'Connected' : 'Not connected'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center sm:justify-end">
                      <ColorPicker
                        color={userColors[provider.name] || provider.color}
                        onChange={(color) => handleColorChange(provider.name, color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {hasUnsavedChanges && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveAllChanges}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    Save Changes & Update Events
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Sync Settings</h2>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Auto-sync</div>
                <div className="text-sm text-gray-600 mt-1">
                  Automatically sync calendars every hour
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="mt-6">
              <button className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                Sync Now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 