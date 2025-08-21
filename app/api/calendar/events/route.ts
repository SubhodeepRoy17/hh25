import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/services/googleCalendar';
import Donor from '@/lib/models/Donor';
import { EventProcessor } from '@/lib/services/eventProcessor';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token from headers
    const token = extractTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const donor = await Donor.findOne({ userId: decoded.userId });
    if (!donor?.calendarIntegration?.accessToken) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
    }

    // Set up Google Calendar service with donor's tokens
    GoogleCalendarService.setCredentials({
      access_token: donor.calendarIntegration.accessToken,
      refresh_token: donor.calendarIntegration.refreshToken,
      expiry_date: donor.calendarIntegration.expiryDate?.getTime()
    });

    // Get events for the next 7 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const events = await GoogleCalendarService.listEvents(timeMin, timeMax);
    
    // Filter and process events
    const relevantEvents = events.filter(EventProcessor.isFoodRelevantEvent);
    
    return NextResponse.json({ events: relevantEvents });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract and verify token from headers
    const token = extractTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (action === 'sync') {
      const donor = await Donor.findOne({ userId: decoded.userId });
      if (!donor?.calendarIntegration?.accessToken) {
        return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
      }

      // Set up Google Calendar service
      GoogleCalendarService.setCredentials({
        access_token: donor.calendarIntegration.accessToken,
        refresh_token: donor.calendarIntegration.refreshToken,
        expiry_date: donor.calendarIntegration.expiryDate?.getTime()
      });

      // Get events and process them
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const events = await GoogleCalendarService.listEvents(timeMin, timeMax);
      await EventProcessor.processNewEvents(events, decoded.userId);

      // Update last sync time
      await Donor.findOneAndUpdate(
        { userId: decoded.userId },
        { 'calendarIntegration.lastSynced': new Date() }
      );

      return NextResponse.json({ 
        success: true, 
        eventsProcessed: events.length,
        remindersCreated: events.filter(EventProcessor.isFoodRelevantEvent).length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar events' },
      { status: 500 }
    );
  }
}