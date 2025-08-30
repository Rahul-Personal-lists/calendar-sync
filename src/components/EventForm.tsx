'use client';

import { useState } from 'react';
import { VoiceEventData, RepeatOptions } from '@/types/events';

interface EventFormProps {
  onEventParsed: (eventData: VoiceEventData) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function EventForm({ onEventParsed, onClose, isOpen }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    isAllDay: false,
    repeat: {
      frequency: 'none',
      interval: 1,
      endDate: '',
      endAfterOccurrences: 10,
      daysOfWeek: [],
      dayOfMonth: 1,
    } as RepeatOptions,
  });

  // Predefined time slots for end time
  const timeSlots = [
    { label: '15 mins', minutes: 15 },
    { label: '30 mins', minutes: 30 },
    { label: '1 hr', minutes: 60 },
    { label: '1:30 hrs', minutes: 90 },
    { label: '2 hrs', minutes: 120 },
    { label: '3 hrs', minutes: 180 },
    { label: '4 hrs', minutes: 240 },
  ];

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toTimeString().slice(0, 5);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };
      
      // Auto-set end time to 1 hour after start time when start time changes
      if (name === 'startTime' && value && !prev.endTime) {
        const endTime = calculateEndTime(value, 60); // Default to 1 hour
        newData.endTime = endTime;
      }
      
      return newData;
    });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const durationMinutes = parseInt(e.target.value);
    if (durationMinutes && formData.startTime) {
      const endTime = calculateEndTime(formData.startTime, durationMinutes);
      setFormData(prev => ({
        ...prev,
        endTime: endTime
      }));
    }
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
    
    // Validate end date for recurring events
    if (formData.repeat.frequency !== 'none' && !formData.repeat.endDate) {
      alert('Please select an end date for recurring events');
      return;
    }
    
    // Auto-set daysOfWeek based on selected date for weekly recurrence
    let repeatData = formData.repeat;
    if (formData.repeat.frequency === 'weekly') {
      // Create date in local timezone to avoid timezone issues
      const [year, month, day] = formData.date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
      const dayOfWeek = selectedDate.getDay();
      repeatData = {
        ...formData.repeat,
        daysOfWeek: [dayOfWeek]
      };
    }

    // Convert form data to VoiceEventData format
    const eventData: VoiceEventData = {
      title: formData.title.trim(),
      date: formData.date,
      time: formData.startTime && formData.endTime ? `${formData.startTime} - ${formData.endTime}` : undefined,
      location: formData.location || undefined,
      description: formData.description || undefined,
      repeat: repeatData.frequency !== 'none' ? repeatData : undefined,
    };

    onEventParsed(eventData);
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0], // Default to today
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      isAllDay: false,
      repeat: {
        frequency: 'none',
        interval: 1,
        endDate: '',
        endAfterOccurrences: 10,
        daysOfWeek: [],
        dayOfMonth: 1,
      } as RepeatOptions,
    });
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0], // Default to today
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      isAllDay: false,
      repeat: {
        frequency: 'none',
        interval: 1,
        endDate: '',
        endAfterOccurrences: 10,
        daysOfWeek: [],
        dayOfMonth: 1,
      } as RepeatOptions,
    });
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Event</h3>
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
            <div className="space-y-4">
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
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  id="duration"
                  name="duration"
                  onChange={handleDurationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={!formData.startTime}
                >
                  <option value="">Select duration</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.minutes} value={slot.minutes}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.endTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {formData.endTime}
                  </div>
                </div>
              )}
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
          <div>
            <label htmlFor="repeat" className="block text-sm font-medium text-gray-700 mb-1">
              Repeat
            </label>
            <select
              id="repeat"
              name="repeat"
              value={formData.repeat.frequency}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                repeat: { ...prev.repeat, frequency: e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Repeat Options Details */}
          {formData.repeat.frequency !== 'none' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Every</span>
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

              {/* Days of Week for Weekly - Auto-set based on selected date */}
              {formData.repeat.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {(() => {
                      // Create date in local timezone to avoid timezone issues
                      const selectedDate = new Date(formData.date);
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const dayIndex = selectedDate.getDay();
                      return dayNames[dayIndex];
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on the selected date ({formData.date})
                  </p>
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
                      const [, , day] = formData.date.split('-').map(Number);
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 