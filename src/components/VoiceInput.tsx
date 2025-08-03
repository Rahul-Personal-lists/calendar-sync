'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceEventData } from '@/types/events';
import { parseVoiceToEvent } from '@/lib/voice-parser';

// Add type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onEventParsed: (eventData: VoiceEventData) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function VoiceInput({ onEventParsed, onClose, isOpen }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        
        // Use the new voice parser
        const parsedEvent = parseVoiceToEvent(transcript);
        if (parsedEvent) {
          console.log('Parsed event from voice:', parsedEvent);
          // Convert to VoiceEventData format with time information
          const voiceEventData: VoiceEventData = {
            title: parsedEvent.title,
            description: parsedEvent.description,
            location: parsedEvent.location,
            // Add the full transcript for the dashboard to parse
            time: transcript,
            date: transcript,
          };
          onEventParsed(voiceEventData);
          onClose();
        } else {
          // Fallback to old parsing if new parser fails
          const fallbackEvent = parseVoiceToEventFallback(transcript);
          if (fallbackEvent) {
            console.log('Parsed event from voice (fallback):', fallbackEvent);
            onEventParsed(fallbackEvent);
            onClose();
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, [onEventParsed, onClose]);

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const parseVoiceToEventFallback = (text: string): VoiceEventData | null => {
    const lowerText = text.toLowerCase();
    
    // Extract title (usually the first part before time/date indicators)
    let title = '';
    let date = '';
    let time = '';
    let location = '';

    // Common time patterns
    const timePatterns = [
      /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
      /at\s+(\d{1,2})\s*(am|pm)/i,
    ];

    // Common date patterns
    const datePatterns = [
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
      /(\d{1,2})\/(\d{1,2})/,
      /today|tomorrow/,
    ];

    // Extract time
    for (const pattern of timePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        time = match[0];
        break;
      }
    }

    // Extract date
    for (const pattern of datePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }

    // Extract location (after "at" or "in")
    const locationMatch = lowerText.match(/(?:at|in)\s+([^,]+?)(?:\s+(?:on|at|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d|january|february|march|april|may|june|july|august|september|october|november|december))/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }

    // Extract title (everything before time/date/location indicators)
    title = text;
    if (time) title = title.replace(new RegExp(time, 'i'), '').trim();
    if (date) title = title.replace(new RegExp(date, 'i'), '').trim();
    if (location) title = title.replace(new RegExp(`(?:at|in)\\s+${location}`, 'i'), '').trim();
    
    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();
    
    // Remove common words that might be at the end
    title = title.replace(/\s+(?:appointment|meeting|event|call|call)$/i, '');

    if (!title) {
      title = 'Untitled Event';
    }

    // Add description with parsed details
    const description = [];
    if (date) description.push(`Date: ${date}`);
    if (time) description.push(`Time: ${time}`);
    if (location) description.push(`Location: ${location}`);

    return {
      title,
      date: date || undefined,
      time: time || undefined,
      location: location || undefined,
      description: description.length > 0 ? description.join(', ') : undefined,
    };
  };

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🎤</div>
            <h3 className="text-lg font-semibold mb-2">Voice Input Not Supported</h3>
            <p className="text-gray-600 mb-4">
              Your browser doesn't support voice input. Please use Chrome or Safari.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          
          <div className="mb-6">
            <div 
              className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={isListening ? stopListening : startListening}
            >
              <div className="text-white text-3xl">
                {isListening ? '⏹️' : '🎤'}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">
              {isListening ? 'Listening...' : 'Speak an event'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Try saying: "Bank appointment at 10am on Wednesday"
            </p>
          </div>

          {transcript && (
            <div className="bg-gray-100 rounded p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Heard:</strong> {transcript}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            {isListening && (
              <button
                onClick={stopListening}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 