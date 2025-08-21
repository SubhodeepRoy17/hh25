import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useCalendar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const connectCalendar = useCallback(async () => {
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
        throw new Error('Failed to get authentication URL');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Google Calendar';
      setError(message);
      toast({
        title: 'Connection Failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const disconnectCalendar = useCallback(async () => {
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
        toast({
          title: 'Disconnected',
          description: 'Google Calendar integration has been disconnected',
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect from Google Calendar';
      setError(message);
      toast({
        title: 'Disconnection Failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const syncEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/calendar/events/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast({
          title: 'Events Synced',
          description: 'Calendar events have been synchronized successfully',
        });
      } else {
        throw new Error('Failed to sync events');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync calendar events';
      setError(message);
      toast({
        title: 'Sync Failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    error,
    connectCalendar,
    disconnectCalendar,
    syncEvents
  };
};