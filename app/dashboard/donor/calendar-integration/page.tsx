'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, Bell, Settings } from 'lucide-react';
import CalendarIntegration from '@/components/calendar-integration';
import EventReminders from '@/components/event-reminders';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Switch } from '@radix-ui/react-switch';

interface EventReminder {
  id: string;
  eventTitle: string;
  eventTime: Date;
  reminderTime: Date;
  location?: string;
  completed: boolean;
}

export default function CalendarIntegrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/calendar/reminders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/calendar/reminders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setReminders(prev => prev.map(reminder =>
          reminder.id === id ? { ...reminder, completed: !enabled } : reminder
        ));
      }
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const handleDismissReminder = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/calendar/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setReminders(prev => prev.filter(reminder => reminder.id !== id));
      }
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  };

  const handleSnoozeReminder = async (id: string, minutes: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/calendar/reminders/${id}/snooze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ minutes })
      });

      if (response.ok) {
        // Refresh reminders after snoozing
        fetchReminders();
      }
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  return (
    <ProtectedRoute requiredRole="donor">
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="border-gray-700 bg-gray-800 hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Calendar Integration</h1>
              <p className="text-gray-400 mt-1">
                Connect your calendar and manage event reminders
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar Integration */}
            <div className="space-y-6">
              <CalendarIntegration />
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Reminder Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how and when you receive reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Reminders</h4>
                      <p className="text-sm text-gray-400">Receive reminders via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-gray-400">Receive push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Reminders</h4>
                      <p className="text-sm text-gray-400">Receive text message reminders</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Reminders */}
            <div>
              <EventReminders
                reminders={reminders}
                onToggleReminder={handleToggleReminder}
                onDismissReminder={handleDismissReminder}
                onSnoozeReminder={handleSnoozeReminder}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}