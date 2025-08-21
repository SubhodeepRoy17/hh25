'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCalendar } from '@/context/CalendarContext';
import { Calendar, RefreshCw, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function CalendarIntegration() {
  const { isConnected, events, isLoading, error, connect, disconnect, refreshEvents } = useCalendar();

  if (isLoading && !isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to get automatic reminders for food logging after events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to get automatic reminders for food logging after events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/15 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="calendar-integration" className="text-base">
              Calendar Integration
            </Label>
            <p className="text-sm text-muted-foreground">
              {isConnected ? 'Connected to Google Calendar' : 'Connect your Google account'}
            </p>
          </div>
          {isConnected ? (
            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline">Disconnected</Badge>
          )}
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshEvents}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Events
              </Button>
              <Button
                onClick={disconnect}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>

            {events.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upcoming Events</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg border bg-muted/50">
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.start.toLocaleDateString()} • {event.start.toLocaleTimeString()}
                      </div>
                      {event.location && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={connect}
            disabled={isLoading}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}