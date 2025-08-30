'use client';

import { useState, useEffect } from 'react';
import { UnifiedEvent, VoiceEventData, CalendarProvider, RepeatOptions } from '@/types/events';
import ProviderIcon from './ProviderIcon';

interface EventEditModalProps {
  event: UnifiedEvent | null;
  onClose: () => void;
  onSave: (eventId: string, updateData: Partial<UnifiedEvent>) => void;
  onDelete?: (eventId: string) => Promise<void>;
  isOpen: boolean;
}

export default function EventEditModal({ event, onClose, onSave, onDelete, isOpen }: EventEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    isAllDay: false,
    provider: 'google' as 'google' | 'outlook' | 'notion' | 'apple' | 'azure-ad',
    repeat: {
      frequency: 'none',
      interval: 1,
      endDate: '',
      endAfterOccurrences: 10,
      daysOfWeek: [],
      dayOfMonth: 1,
    } as RepeatOptions,
  });
  
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'single' | 'following' | 'series' | null>(null);

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
      repeat: event.repeat || {
        frequency: 'none',
        interval: 1,
        endDate: '',
        endAfterOccurrences: 10,
        daysOfWeek: [],
        dayOfMonth: 1,
      } as RepeatOptions,
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
          displayName: provider.provider === 'azure-ad' ? 'Outlook' : 
                      provider.provider === 'notion' ? 'Notion' :
                      provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1),
          icon: '📅', // Placeholder since we're using ProviderIcon component
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter an event title');
      return;
    }
    
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    // Validate end date for recurring events
    if (formData.repeat.frequency !== 'none' && !formData.repeat.endDate) {
      alert('Please select an end date for recurring events');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert form data to UnifiedEvent format
      const startDateTime = formData.isAllDay 
        ? new Date(formData.date).toISOString().split('T')[0]
        : new Date(`${formData.date}T${formData.startTime}`).toISOString();
      
      const endDateTime = formData.isAllDay
        ? new Date(formData.date).toISOString().split('T')[0]
        : new Date(`${formData.date}T${formData.endTime}`).toISOString();
      
      const updateData: Partial<UnifiedEvent> = {
        title: formData.title.trim(),
        start_time: startDateTime,
        end_time: endDateTime,
        location: formData.location || undefined,
        description: formData.description || undefined,
        is_all_day: formData.isAllDay,
        repeat: formData.repeat.frequency !== 'none' ? formData.repeat : undefined,
        provider: formData.provider,
      };

      await onSave(event.id, updateData);
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete || !deleteScope) return;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      // For now, we'll just delete the event normally
      // In the future, we can extend the onDelete function to accept delete scope
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteScope(null);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Event</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
                    <ProviderIcon provider={provider.name} size={20} />
                  </label>
                ))}
                {providers.filter(p => p.isConnected).length === 0 && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          {/* Time Fields - Only show if not all day */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="Enter event description"
            />
          </div>

          {/* Repeat Options */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Repeat
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  repeat: {
                    ...prev.repeat,
                    frequency: prev.repeat.frequency === 'none' ? 'daily' : 'none'
                  }
                }))}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {formData.repeat.frequency === 'none' ? 'Add repeat' : 'Remove repeat'}
              </button>
            </div>
            
            {formData.repeat.frequency !== 'none' && (
              <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.repeat.frequency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      repeat: { ...prev.repeat, frequency: e.target.value as any }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Every
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.repeat.interval}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        repeat: { ...prev.repeat, interval: parseInt(e.target.value) || 1 }
                      }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                    <span className="text-sm text-gray-600">
                      {formData.repeat.frequency === 'daily' && 'day(s)'}
                      {formData.repeat.frequency === 'weekly' && 'week(s)'}
                      {formData.repeat.frequency === 'monthly' && 'month(s)'}
                      {formData.repeat.frequency === 'yearly' && 'year(s)'}
                    </span>
                  </div>
                </div>

                {/* Days of Week for Weekly */}
                {formData.repeat.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days of Week
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <label key={day} className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={formData.repeat.daysOfWeek?.includes(index) || false}
                            onChange={(e) => {
                              const currentDays = formData.repeat.daysOfWeek || [];
                              const newDays = e.target.checked
                                ? [...currentDays, index]
                                : currentDays.filter(d => d !== index);
                              setFormData(prev => ({
                                ...prev,
                                repeat: { ...prev.repeat, daysOfWeek: newDays }
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-1 text-xs">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day of Month for Monthly/Yearly - Auto-set based on selected date */}
                {(formData.repeat.frequency === 'monthly' || formData.repeat.frequency === 'yearly') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Month
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                      {(() => {
                        // Extract day from selected date
                        const [year, month, day] = formData.date.split('-').map(Number);
                        return day;
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on the selected date ({formData.date})
                    </p>
                  </div>
                )}

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.repeat.endDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      repeat: { ...prev.repeat, endDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete Event
              </button>
            </div>
          )}
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 max-w-sm w-full mx-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Delete Event</h4>
              
              {/* Check if this is a recurring event */}
              {event.repeat && event.repeat.frequency !== 'none' ? (
                <>
                  <p className="text-gray-600 mb-4">
                    This is a recurring event. What would you like to delete?
                  </p>
                  <div className="space-y-2 mb-6">
                    <button
                      onClick={() => setDeleteScope('single')}
                      disabled={isDeleting}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        deleteScope === 'single'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">This event</div>
                      <div className="text-sm text-gray-500">Delete only this occurrence</div>
                    </button>
                    <button
                      onClick={() => setDeleteScope('following')}
                      disabled={isDeleting}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        deleteScope === 'following'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">This and all following events</div>
                      <div className="text-sm text-gray-500">Delete this and future occurrences</div>
                    </button>
                    <button
                      onClick={() => setDeleteScope('series')}
                      disabled={isDeleting}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        deleteScope === 'series'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">All events in the series</div>
                      <div className="text-sm text-gray-500">Delete the entire recurring series</div>
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteScope(null);
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting || !deleteScope}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{event.title}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setDeleteScope('single');
                        handleDelete();
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 