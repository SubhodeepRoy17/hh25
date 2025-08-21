'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CalendarEvent {
  summary: string;
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

interface CalendarIntegration {
  isConnected: boolean;
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const CalendarContext = createContext<CalendarIntegration | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/calendar/auth/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
      }
    } catch (err) {
      console.error('Error checking calendar connection:', err);
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/calendar/auth/url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/calendar/auth/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsConnected(false);
        setEvents([]);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEvents = async () => {
    if (!isConnected) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/calendar/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      } else {
        throw new Error('Failed to fetch events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isConnected) {
      refreshEvents();
      
      // Refresh events every 5 minutes
      const interval = setInterval(refreshEvents, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const value: CalendarIntegration = {
    isConnected,
    events,
    isLoading,
    error,
    connect,
    disconnect,
    refreshEvents
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};