'use client';

import { useState, useEffect } from 'react';
import { UnifiedEvent, VoiceEventData, CalendarProvider } from '@/types/events';

interface EventEditModalProps {
  event: UnifiedEvent | null;
  onClose: () => void;
  onSave: (eventData: VoiceEventData) => void;
  isOpen: boolean;
}

export default function EventEditModal({ event, onClose, onSave, isOpen }: EventEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    isAllDay: false,
    provider: 'google' as 'google' | 'outlook' | 'notion' | 'apple' | 'azure-ad',
  });
  
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  // Load event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      loadEventData();
      fetchProviders();
    }
  }, [isOpen, event]);

  const loadEventData = () => {
    if (!event) return;
    
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    setFormData({
      title: event.title,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      location: event.location || '',
      description: event.description || '',
      isAllDay: event.is_all_day || false,
      provider: event.provider,
    });
  };

  const fetchProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const response = await fetch('/api/providers');
      if (response.ok) {
        const data = await response.json();
        const calendarProviders: CalendarProvider[] = data.map((provider: any) => ({
          id: provider.provider,
          name: provider.provider,
          displayName: provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1),
          icon: getProviderIcon(provider.provider),
          isConnected: !!provider.access_token,
          color: getProviderColor(provider.provider),
        }));
        setProviders(calendarProviders);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return '📅';
      case 'outlook': return '📧';
      case 'notion': return '📝';
      case 'apple': return '🍎';
      case 'azure-ad': return '☁️';
      default: return '📅';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google': return '#4285F4';
      case 'outlook': return '#0078D4';
      case 'notion': return '#000000';
      case 'apple': return '#000000';
      case 'azure-ad': return '#0078D4';
      default: return '#6B7280';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };
      
      // Auto-set end time to 1 hour after start time when start time changes
      if (name === 'startTime' && value && !prev.endTime) {
        const startTime = new Date(`2000-01-01T${value}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
        newData.endTime = endTime.toTimeString().slice(0, 5);
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter an event title');
      return;
    }
    
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    // Convert form data to VoiceEventData format
    const eventData: VoiceEventData = {
      title: formData.title.trim(),
      date: formData.date,
      time: formData.startTime && formData.endTime ? `${formData.startTime} - ${formData.endTime}` : undefined,
      location: formData.location || undefined,
      description: formData.description || undefined,
      provider: formData.provider,
    };

    onSave(eventData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Event</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Calendar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calendar *
            </label>
            {isLoadingProviders ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Loading calendars...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {providers.filter(p => p.isConnected).map((provider) => (
                  <label key={provider.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value={provider.name}
                      checked={formData.provider === provider.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as any }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{provider.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{provider.displayName}</span>
                    </div>
                  </label>
                ))}
                {providers.filter(p => p.isConnected).length === 0 && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                    No calendars connected. Please connect a calendar in Settings first.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              name="isAllDay"
              checked={formData.isAllDay}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-700">
              All day event
            </label>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Time Fields - Only show if not all day */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter location"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 