import { OAuth2Client } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  async getAuthUrl(): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
      ],
      prompt: 'consent'
    });
  }

  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async listEvents(timeMin: string, timeMax: string): Promise<calendar_v3.Schema$Event[]> {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }

  async watchEvents(channel: any): Promise<any> {
    const response = await this.calendar.events.watch({
      calendarId: 'primary',
      requestBody: channel
    });
    
    return response.data;
  }

  async stopChannel(resourceId: string): Promise<void> {
    await this.calendar.channels.stop({
      requestBody: {
        id: resourceId,
        resourceId
      }
    });
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.get({
      calendarId: 'primary',
      eventId
    });
    
    return response.data;
  }
}

export default new GoogleCalendarService();