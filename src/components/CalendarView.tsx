'use client';

import { useState, useEffect } from 'react';
import { UnifiedEvent } from '@/types/events';

interface CalendarViewProps {
  events: UnifiedEvent[];
  onEventClick?: (event: UnifiedEvent) => void;
  onEventDelete?: (eventId: string) => Promise<void>;
  userColors?: Record<string, string>;
}

export default function CalendarView({ 
  events, 
  onEventClick, 
  onEventDelete,
  userColors = {} 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [colorKey, setColorKey] = useState(0);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Force re-render when userColors change
  useEffect(() => {
    setColorKey(prev => prev + 1);
  }, [userColors]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getProviderColor = (provider: UnifiedEvent['provider']) => {
    // Check if user has a custom color for this provider
    if (userColors[provider]) {
      return `bg-[${userColors[provider]}]`;
    }
    
    // Fallback to default colors
    const colors = {
      google: 'bg-calendar-google',
      'azure-ad': 'bg-calendar-outlook', // Map azure-ad to outlook color
      outlook: 'bg-calendar-outlook',
      notion: 'bg-calendar-notion',
      apple: 'bg-calendar-apple',
    };
    return colors[provider] || 'bg-gray-500';
  };

  const getProviderColorStyle = (provider: UnifiedEvent['provider']) => {
    // Return inline style for custom colors
    if (userColors[provider]) {
      return { backgroundColor: userColors[provider] };
    }
    return {};
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!onEventDelete) return;
    
    setDeletingEventId(eventId);
    setShowDeleteConfirm(null);
    
    try {
      await onEventDelete(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
      // You could add a toast notification here
    } finally {
      setDeletingEventId(null);
    }
  };

  const renderCalendarGrid = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-gray-400"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <div
          key={day}
          className={`p-2 min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isSelected ? 'bg-blue-100 border-blue-400' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate cursor-pointer text-white ${
                  userColors[event.provider] ? '' : getProviderColor(event.provider)
                }`}
                style={getProviderColorStyle(event.provider)}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
                title={`${event.title} (${event.provider})`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="bg-white rounded-lg shadow" key={colorKey}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Today
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded"
              style={userColors['google'] ? { backgroundColor: userColors['google'] } : { backgroundColor: '#4285f4' }}
            ></div>
            <span>Google</span>
          </div>
          <div className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded"
              style={userColors['azure-ad'] ? { backgroundColor: userColors['azure-ad'] } : { backgroundColor: '#0078d4' }}
            ></div>
            <span>Outlook (Azure AD)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded"
              style={userColors['notion'] ? { backgroundColor: userColors['notion'] } : { backgroundColor: '#000000' }}
            ></div>
            <span>Notion</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarGrid()}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t p-4">
          <h3 className="font-semibold mb-3">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map(event => (
              <div
                key={event.id}
                className={`p-3 rounded-lg cursor-pointer text-white group ${
                  userColors[event.provider] ? '' : getProviderColor(event.provider)
                }`}
                style={getProviderColorStyle(event.provider)}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.start_time && (
                      <div className="text-sm opacity-90">
                        {new Date(event.start_time).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                    {event.location && (
                      <div className="text-sm opacity-90">📍 {event.location}</div>
                    )}
                  </div>
                  
                  {onEventDelete && (
                    <div className="ml-2">
                      {showDeleteConfirm === event.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deletingEventId === event.id}
                            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white disabled:opacity-50"
                          >
                            {deletingEventId === event.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(event.id);
                          }}
                          disabled={deletingEventId === event.id}
                          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          title="Delete event"
                        >
                          {deletingEventId === event.id ? '⋯' : '×'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <div className="text-gray-500 text-center py-4">
                No events scheduled
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 