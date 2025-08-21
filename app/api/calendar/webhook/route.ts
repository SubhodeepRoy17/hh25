import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/services/googleCalendar';
import Donor from '@/lib/models/Donor';
import { EventProcessor } from '@/lib/services/eventProcessor';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a valid Google Calendar push notification
    const channelId = request.headers.get('X-Goog-Channel-ID');
    const resourceState = request.headers.get('X-Goog-Resource-State');
    
    if (!channelId || resourceState !== 'exists') {
      return NextResponse.json({ error: 'Invalid webhook request' }, { status: 400 });
    }

    // Find the donor with this webhook channel
    const donor = await Donor.findOne({ 'calendarIntegration.webhookId': channelId });
    if (!donor) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Set up Google Calendar service
    GoogleCalendarService.setCredentials({
      access_token: donor.calendarIntegration.accessToken,
      refresh_token: donor.calendarIntegration.refreshToken,
      expiry_date: donor.calendarIntegration.expiryDate?.getTime()
    });

    // Get the updated event
    const { resourceId } = await request.json();
    const event = await GoogleCalendarService.getEvent(resourceId);
    
    // Process the event for reminders
    await EventProcessor.scheduleEventReminders(event, donor.userId.toString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Google Calendar webhook verification
  const challenge = request.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Challenge required' }, { status: 400 });
}