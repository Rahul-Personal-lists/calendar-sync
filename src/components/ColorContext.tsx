'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ColorContextType {
  userColors: Record<string, string>;
  updateColor: (provider: string, color: string) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const defaultColors = {
  'google': '#4285f4',
  'azure-ad': '#68217a',
  'outlook': '#0078d4',
  'notion': '#000000',
  'apple': '#007aff',
};

export function ColorProvider({ children }: { children: ReactNode }) {
  const [userColors, setUserColors] = useState<Record<string, string>>(defaultColors);

  // Load colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem('calendar-colors');
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors);
        setUserColors({ ...defaultColors, ...parsedColors });
      } catch (error) {
        console.error('Error parsing saved colors:', error);
      }
    }
  }, []);

  const updateColor = (provider: string, color: string) => {
    const newColors = { ...userColors, [provider]: color };
    setUserColors(newColors);
    localStorage.setItem('calendar-colors', JSON.stringify(newColors));
  };

  return (
    <ColorContext.Provider value={{ userColors, updateColor }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColors() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColors must be used within a ColorProvider');
  }
  return context;
} 