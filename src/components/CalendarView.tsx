'use client';

import { useState, useEffect } from 'react';
import { UnifiedEvent } from '@/types/events';
import { getProviderDisplayName } from '@/lib/provider-utils';

type CalendarViewType = 'day' | 'week' | 'month';

interface CalendarViewProps {
  events: UnifiedEvent[];
  onEventClick?: (event: UnifiedEvent) => void;
  onEventEdit?: (event: UnifiedEvent) => void;
  userColors?: Record<string, string>;
}

export default function CalendarView({ 
  events, 
  onEventClick, 
  onEventEdit,
  userColors = {} 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<CalendarViewType>('day');
  const [colorKey, setColorKey] = useState(0);

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
      month: 'short'
    });
  };

  const formatDateWithYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short'
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

  const isRecurringEvent = (event: UnifiedEvent) => {
    return event.repeat && event.repeat.frequency !== 'none';
  };

  const getRepeatIcon = (event: UnifiedEvent) => {
    if (!isRecurringEvent(event)) return null;
    
    const frequency = event.repeat?.frequency;
    switch (frequency) {
      case 'daily': return '🔄';
      case 'weekly': return '📅';
      case 'monthly': return '📆';
      case 'yearly': return '🎯';
      default: return '🔄';
    }
  };

  const handleEditEvent = (event: UnifiedEvent) => {
    if (onEventEdit) {
      onEventEdit(event);
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
                title={`${event.title} (${getProviderDisplayName(event.provider)})${isRecurringEvent(event) ? ' - Recurring' : ''}`}
              >
                <div className="flex items-center space-x-1">
                  {getRepeatIcon(event) && (
                    <span className="text-xs">{getRepeatIcon(event)}</span>
                  )}
                  <span className="truncate">{event.title}</span>
                </div>
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

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <div
          key={i}
          className={`p-2 min-h-[120px] border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isSelected ? 'bg-blue-100 border-blue-400' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {date.getDate()}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 5).map((event, index) => (
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
                title={`${event.title} (${getProviderDisplayName(event.provider)})${isRecurringEvent(event) ? ' - Recurring' : ''}`}
              >
                <div className="flex items-center space-x-1">
                  {getRepeatIcon(event) && (
                    <span className="text-xs">{getRepeatIcon(event)}</span>
                  )}
                  <span className="truncate">{event.title}</span>
                </div>
              </div>
            ))}
            {dayEvents.length > 5 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 5} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="p-4">
        <div className={`p-4 rounded-lg border ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="mt-4 space-y-2">
            {dayEvents.length > 0 ? (
              dayEvents.map(event => (
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
                      <div className="font-medium flex items-center space-x-2">
                        {getRepeatIcon(event) && (
                          <span className="text-sm">{getRepeatIcon(event)}</span>
                        )}
                        <span>{event.title}</span>
                      </div>
                      {event.start_time && (
                        <div className="text-sm opacity-90">
                          {new Date(event.start_time).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                          {event.end_time && (
                            <span>
                              {' - '}
                              {new Date(event.end_time).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                      )}
                      {event.location && (
                        <div className="text-sm opacity-90">📍 {event.location}</div>
                      )}
                    </div>
                    
                    {onEventEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit event"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-8">
                No events scheduled for today
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getViewTitle = () => {
    if (viewType === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (viewType === 'week') {
      // On mobile, just show today's date for week view
      if (window.innerWidth < 768) {
        return currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return formatDateWithYear(currentDate);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow" key={colorKey}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPeriod}
                className="p-2 hover:bg-gray-100 rounded text-lg font-bold"
              >
                ‹
              </button>
              <h2 className="text-lg font-semibold">{getViewTitle()}</h2>
              <button
                onClick={goToNextPeriod}
                className="p-2 hover:bg-gray-100 rounded text-lg font-bold"
              >
                ›
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Today
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Type Selector */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('day')}
                className={`px-3 py-1 text-sm rounded ${
                  viewType === 'day' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1 text-sm rounded ${
                  viewType === 'week' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1 text-sm rounded ${
                  viewType === 'month' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
            
            {/* Provider Icons */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={userColors['google'] ? { backgroundColor: userColors['google'] } : { backgroundColor: '#4285f4' }}
                >
                  G
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={userColors['azure-ad'] ? { backgroundColor: userColors['azure-ad'] } : { backgroundColor: '#0078d4' }}
                >
                  O
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={userColors['notion'] ? { backgroundColor: userColors['notion'] } : { backgroundColor: '#000000' }}
                >
                  N
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {viewType === 'day' ? (
        renderDayView()
      ) : (
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
            {viewType === 'week' ? renderWeekView() : renderCalendarGrid()}
          </div>
        </div>
      )}

      {/* Selected Date Events */}
      {selectedDate && viewType !== 'day' && (
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
                        {event.end_time && (
                          <span>
                            {' - '}
                            {new Date(event.end_time).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    )}
                    {event.location && (
                      <div className="text-sm opacity-90">📍 {event.location}</div>
                    )}
                  </div>
                  
                  {onEventEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit event"
                    >
                      ✏️
                    </button>
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