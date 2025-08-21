export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName: string;
    responseStatus: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface CalendarIntegration {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  enabled: boolean;
  lastSynced?: Date;
  webhookId?: string;
  resourceId?: string;
}

export interface EventReminder {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventTime: Date;
  reminderTime: Date;
  location?: string;
  completed: boolean;
  dismissed: boolean;
  snoozedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarWebhookNotification {
  id: string;
  type: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: number;
}

export interface CalendarSyncState {
  lastSyncTime: Date;
  eventsProcessed: number;
  remindersCreated: number;
  errors: number;
}