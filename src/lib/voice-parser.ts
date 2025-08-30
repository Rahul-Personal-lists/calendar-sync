import { VoiceEventData } from '@/types/events';

interface ParsedEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

export function parseVoiceToEvent(text: string): ParsedEvent | null {
  const lowerText = text.toLowerCase();
  console.log('Parsing voice input:', text);
  
  // Extract event type and details using regex patterns similar to the Python script
  const patterns = [
    // NEW: Pattern for [event] in [month day] at [time] - FIXED TITLE EXTRACTION (MOST SPECIFIC FIRST)
    /([a-z]+(?:\s+[a-z]+)*)\s+in\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))/i,
    
    // NEW: Pattern for [event] on [month day] at [time] - FIXED ORDER
    /([a-z]+(?:\s+[a-z]+)*)\s+on\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))/i,
    
    // NEW: Pattern for [event] [month day] at [time] (without "on") - FIXED ORDER
    /([a-z]+(?:\s+[a-z]+)*)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))/i,
    
    // NEW: Pattern for [event] at [time] on [month day] - FIXED ORDER
    /([a-z]+(?:\s+[a-z]+)*)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))\s+on\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?)/i,
    
    // NEW: Pattern for [event] on [day name] at [time] - FIXED ORDER
    /([a-z]+(?:\s+[a-z]+)*)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))/i,
    
    // Pattern: [event] at [time] [date]
    /(meeting|call|appointment|coffee|lunch|dinner|event)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))(?:\s+(?:on|this|next|)?\s*)?(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    
    // Pattern: [event] [date] at [time]
    /(meeting|call|appointment|coffee|lunch|dinner|event)\s+(tomorrow|today|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))(?:\s+at\s+)(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))/i,
    
    // Pattern: [any word] at [time] [date] (but not if it contains "in" followed by month)
    /([a-z]+(?:\s+[a-z]+){0,3})\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))(?:\s+(?:on|this|next|)?\s*)?(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?!\s+in\s+\w+)/i,
    
    // Pattern: [event] [date] at [time] (alternative order)
    /(meeting|call|appointment|coffee|lunch|dinner|event)\s+(tomorrow|today|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.))/i
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      console.log('Found match:', match.groups || match);
      
      let eventType: string;
      let timeStr: string;
      let dateStr: string;
      
      // Determine the pattern type based on the regex
      const patternStr = pattern.toString();
      
      if (patternStr.includes('\\s+on\\s+') && patternStr.includes('\\s+at\\s+')) {
        // Pattern: [event] on [date] at [time]
        eventType = match[1];
        dateStr = match[2];
        timeStr = match[3];
      } else if (patternStr.includes('\\s+in\\s+') && patternStr.includes('\\s+at\\s+')) {
        // Pattern: [event] in [date] at [time]
        eventType = match[1];
        dateStr = match[2];
        timeStr = match[3];
      } else if (patternStr.includes('\\s+at\\s+') && patternStr.includes('\\s+on\\s+')) {
        // Pattern: [event] at [time] on [date]
        eventType = match[1];
        timeStr = match[2];
        dateStr = match[3];
      } else if (patternStr.includes('\\s+at\\s+') && !patternStr.includes('\\s+on\\s+')) {
        // Pattern: [event] at [time] [date] or [event] [date] at [time]
        if (match[2].match(/\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.)/i)) {
          // [event] at [time] [date]
          eventType = match[1];
          timeStr = match[2];
          dateStr = match[3];
        } else {
          // [event] [date] at [time]
          eventType = match[1];
          dateStr = match[2];
          timeStr = match[3];
        }
      } else {
        // Default fallback
        eventType = match[1];
        timeStr = match[2];
        dateStr = match[3];
      }
      
      console.log('Extracted:', { eventType, timeStr, dateStr });
      
      // Parse the time
      const parsedTime = parseTime(timeStr);
      if (!parsedTime) {
        console.log('Could not parse time:', timeStr);
        continue;
      }
      
      // Parse the date
      const parsedDate = parseRelativeDate(dateStr);
      if (!parsedDate) {
        console.log('Could not parse date:', dateStr);
        continue;
      }
      
      // Combine date and time
      const eventDateTime = new Date(parsedDate);
      eventDateTime.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
      
      // Set end time (1 hour default)
      const endDateTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000);
      
      console.log('Event datetime (local):', eventDateTime.toLocaleString());
      console.log('Event datetime (ISO):', eventDateTime.toISOString());
      
      // Extract location if present (but not if it's a date)
      const locationMatch = lowerText.match(/(?:at|in)\s+([^,]+?)(?:\s+(?:on|at|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d|january|february|march|april|may|june|july|august|september|october|november|december))/i);
      let location = locationMatch ? locationMatch[1].trim() : undefined;
      
      // Don't use location if it's actually a date or part of the date string
      if (location && (parseRelativeDate(location) || dateStr.includes(location))) {
        location = undefined;
      }
      
      // Create description with parsed details
      const description = [];
      if (dateStr) description.push(`Date: ${dateStr}`);
      if (timeStr) description.push(`Time: ${timeStr}`);
      if (location) description.push(`Location: ${location}`);
      
      // Clean up the title - remove "in", "on", "at" from the end
      let cleanTitle = eventType.charAt(0).toUpperCase() + eventType.slice(1);
      cleanTitle = cleanTitle.replace(/\s+(in|on|at)$/i, '');
      
      const result = {
        title: cleanTitle,
        start: eventDateTime,
        end: endDateTime,
        description: description.length > 0 ? description.join(', ') : undefined,
        location,
      };
      
      console.log('Parsed event:', result);
      return result;
    }
  }
  
  console.log('No patterns matched for text:', text);
  return null;
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  // Clean up time string
  timeStr = timeStr.toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  
  // Try different time formats
  const formats = [
    /^(\d{1,2}):(\d{2})(am|pm)$/,  // 11:30am
    /^(\d{1,2})(am|pm)$/,           // 11am
    /^(\d{1,2}):(\d{2})(a\.m\.|p\.m\.)$/,  // 11:30a.m.
    /^(\d{1,2})(a\.m\.|p\.m\.)$/,   // 11a.m.
  ];
  
  for (const format of formats) {
    const match = timeStr.match(format);
    if (match) {
      let hours = parseInt(match[1]);
      let minutes = 0;
      let period = '';
      
      // Handle different format patterns
      if (match.length === 4) {
        // Format: /^(\d{1,2}):(\d{2})(am|pm)$/ or /^(\d{1,2}):(\d{2})(a\.m\.|p\.m\.)$/
        minutes = parseInt(match[2]);
        period = match[3];
      } else if (match.length === 3) {
        // Format: /^(\d{1,2})(am|pm)$/ or /^(\d{1,2})(a\.m\.|p\.m\.)$/
        period = match[2];
      }
      
      // Convert to 24-hour format
      if (period.includes('pm') && hours !== 12) {
        hours += 12;
      }
      if (period.includes('am') && hours === 12) {
        hours = 0;
      }
      
      return { hours, minutes };
    }
  }
  
  return null;
}

function parseRelativeDate(dateStr: string): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const lowerDate = dateStr.toLowerCase().trim();
  
  if (lowerDate === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  if (lowerDate === 'today') {
    return today;
  }
  
  // Handle month names with day numbers (e.g., "August 15", "Dec 25")
  const monthNames: Record<string, number> = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };
  
  // Pattern for "Month Day" or "Month Day, Year" (with optional ordinal)
  const monthDayPattern = /^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,\s*(\d{4}))?$/;
  const match = lowerDate.match(monthDayPattern);
  
  if (match) {
    const monthName = match[1].toLowerCase();
    const day = parseInt(match[2]);
    const year = match[3] ? parseInt(match[3]) : today.getFullYear();
    
    if (monthNames[monthName] !== undefined) {
      const month = monthNames[monthName];
      const targetDate = new Date(year, month, day);
      
      // If no year specified and the date has passed this year, assume next year
      if (!match[3] && targetDate < today) {
        targetDate.setFullYear(year + 1);
      }
      
      return targetDate;
    }
  }
  
  // Handle day names
  const days = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  };
  
  for (const [dayName, dayNum] of Object.entries(days)) {
    if (lowerDate.includes(dayName)) {
      const currentDay = today.getDay();
      let daysAhead = dayNum - currentDay;
      
      if (lowerDate.includes('next')) {
        daysAhead += 7;
      } else if (daysAhead <= 0) {
        // If the day has passed this week, go to next week
        daysAhead += 7;
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysAhead);
      return targetDate;
    }
  }
  
  return null;
}

export function convertVoiceDataToEventData(voiceData: VoiceEventData): {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
  repeat?: any;
} {
  // If we have a properly formatted date (YYYY-MM-DD), use it directly
  if (voiceData.date && voiceData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = voiceData.date.split('-').map(Number);
    let start = new Date(year, month - 1, day); // month is 0-indexed
    
    // If we also have a time, parse it and set the time
    if (voiceData.time) {
      const timeMatch = voiceData.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        start.setHours(hours, minutes, 0, 0);
      }
    }
    
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    
    return {
      title: voiceData.title,
      start: start.toISOString(),
      end: end.toISOString(),
      description: voiceData.description,
      location: voiceData.location,
      isAllDay: false,
      repeat: voiceData.repeat,
    };
  }
  
  // Fallback: try to re-parse the voice input
  const parsedEvent = parseVoiceToEvent(`${voiceData.title} ${voiceData.time || ''} ${voiceData.date || ''}`);
  
  if (parsedEvent) {
    return {
      title: parsedEvent.title,
      start: parsedEvent.start.toISOString(),
      end: parsedEvent.end.toISOString(),
      description: parsedEvent.description,
      location: parsedEvent.location,
      isAllDay: false,
      repeat: voiceData.repeat,
    };
  }
  
  // Final fallback to original logic if parsing fails
  let start: Date;
  let end: Date;
  
  // Try to parse date and time from voice input
  if (voiceData.date || voiceData.time) {
    const parsedDate = parseVoiceDateTime(voiceData.date, voiceData.time);
    if (parsedDate) {
      start = parsedDate;
      end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    } else {
      // If parsing fails, use the date from the form directly
      if (voiceData.date) {
        const [year, month, day] = voiceData.date.split('-').map(Number);
        start = new Date(year, month - 1, day); // month is 0-indexed
        end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
      } else {
        start = new Date();
        end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
      }
    }
  } else {
    start = new Date();
    end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
  }
  
  return {
    title: voiceData.title,
    start: start.toISOString(),
    end: end.toISOString(),
    description: voiceData.description,
    location: voiceData.location,
    isAllDay: false,
    repeat: voiceData.repeat,
  };
}

// Keep the original function as fallback
function parseVoiceDateTime(dateStr?: string, timeStr?: string): Date | null {
  try {
    const now = new Date();
    let targetDate = new Date(now);
    
    // Parse date
    if (dateStr) {
      const lowerDate = dateStr.toLowerCase();
      if (lowerDate === 'tomorrow') {
        targetDate.setDate(now.getDate() + 1);
      } else if (lowerDate === 'today') {
        // Keep current date
      } else if (lowerDate.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)) {
        const dayMap: Record<string, number> = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        const targetDay = dayMap[lowerDate];
        const currentDay = now.getDay();
        const daysToAdd = (targetDay - currentDay + 7) % 7;
        targetDate.setDate(now.getDate() + daysToAdd);
      }
    }
    
    // Parse time
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        targetDate.setHours(hours, minutes, 0, 0);
      }
    }
    
    return targetDate;
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return null;
  }
} 