import Donor from '@/lib/models/Donor';
import User from '@/lib/models/User';
import { createEventReminder } from './notifications';
import { calendar_v3 } from 'googleapis';

export class EventProcessor {
  static isFoodRelevantEvent(event: calendar_v3.Schema$Event): boolean {
    const title = event.summary?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    
    // Keywords that indicate food-related events
    const foodKeywords = [
      'food', 'lunch', 'dinner', 'breakfast', 'catering', 'meal',
      'feast', 'banquet', 'buffet', 'reception', 'party', 'gathering',
      'conference', 'seminar', 'workshop', 'fest', 'festival', 'event'
    ];
    
    return foodKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  static extractEventDetails(event: calendar_v3.Schema$Event): {
    title: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    description?: string;
  } {
    // Handle null/undefined values by converting them to undefined
    const location = event.location ? String(event.location) : undefined;
    const description = event.description ? String(event.description) : undefined;
    
    return {
      title: event.summary || 'Untitled Event',
      startTime: new Date(event.start?.dateTime || event.start?.date || Date.now()),
      endTime: new Date(event.end?.dateTime || event.end?.date || Date.now()),
      location,
      description
    };
  }

  static async scheduleEventReminders(event: calendar_v3.Schema$Event, userId: string): Promise<void> {
    if (!this.isFoodRelevantEvent(event)) return;

    const eventDetails = this.extractEventDetails(event);
    const donor = await Donor.findOne({ userId });
    
    if (!donor || donor.orgType !== 'event') return;

    // Schedule reminder for 30 minutes after event ends
    const reminderTime = new Date(eventDetails.endTime.getTime() + 30 * 60 * 1000);
    
    await createEventReminder(
      userId,
      event.id!,
      eventDetails.title,
      reminderTime,
      eventDetails.location
    );
  }

  static async processNewEvents(events: calendar_v3.Schema$Event[], userId: string): Promise<void> {
    for (const event of events) {
      await this.scheduleEventReminders(event, userId);
    }
  }
}