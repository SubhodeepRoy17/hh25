'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface EventReminder {
  id: string;
  eventTitle: string;
  eventTime: Date;
  reminderTime: Date;
  location?: string;
  completed: boolean;
}

interface EventRemindersProps {
  reminders: EventReminder[];
  onToggleReminder: (id: string, enabled: boolean) => void;
  onDismissReminder: (id: string) => void;
  onSnoozeReminder: (id: string, minutes: number) => void;
}

export default function EventReminders({
  reminders,
  onToggleReminder,
  onDismissReminder,
  onSnoozeReminder
}: EventRemindersProps) {
  const [snoozeTime, setSnoozeTime] = useState(30);

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Event Reminders
          </CardTitle>
          <CardDescription>
            You don't have any upcoming event reminders
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Event Reminders
        </CardTitle>
        <CardDescription>
          Reminders to log food after your events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1">
                <div className="font-medium">{reminder.eventTitle}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {reminder.eventTime.toLocaleDateString()} • {reminder.eventTime.toLocaleTimeString()}
                </div>
                {reminder.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {reminder.location}
                  </div>
                )}
              </div>
              <Badge variant={reminder.completed ? "outline" : "default"}>
                {reminder.completed ? "Completed" : "Pending"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!reminder.completed}
                  onCheckedChange={(checked) => onToggleReminder(reminder.id, checked)}
                />
                <Label htmlFor={`reminder-${reminder.id}`}>
                  {reminder.completed ? 'Enable reminder' : 'Disable reminder'}
                </Label>
              </div>
              
              {!reminder.completed && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSnoozeReminder(reminder.id, snoozeTime)}
                  >
                    Snooze
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDismissReminder(reminder.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}